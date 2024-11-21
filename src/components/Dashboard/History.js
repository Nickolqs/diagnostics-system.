import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/global.css";

function History() {
    const [history, setHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const [selectedAction, setSelectedAction] = useState(null);
    const [elementDetails, setElementDetails] = useState(null);
    const [resultImage, setResultImage] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            console.error("User ID is not found.");
            return;
        }

        axios
            .get("http://localhost:5000/history", { params: { user_id: userId } })
            .then((response) => setHistory(response.data))
            .catch((error) => console.error("Error fetching history:", error));
    }, []);

    const handleRowClick = (action) => {
        if (action.Action_Type === "Diagnose") {
            axios
                .get("http://localhost:5000/diagnose-details", {
                    params: { action_id: action.Action_ID },
                })
                .then((response) => {
                    setElementDetails(response.data.element_details);
                    setResultImage(`http://localhost:5000/static/${response.data.result_image}`);
                    setSelectedAction(action);
                })
                .catch((error) => console.error("Error fetching diagnose details:", error));
        }
    };

    const closeModal = () => {
        setSelectedAction(null);
        setElementDetails(null);
        setResultImage(null);
    };

    const totalPages = Math.ceil(history.length / itemsPerPage);
    const currentItems = history.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="form-section">
            <h2>History</h2>
            <table className="table-container">
                <thead>
                    <tr>
                        <th>Action ID</th>
                        <th>Action Type</th>
                        <th>Timestamp</th>
                        <th>User</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((item) => (
                        <tr
                            key={item.Action_ID}
                            onClick={() => handleRowClick(item)}
                            style={{ cursor: "pointer" }}
                        >
                            <td>{item.Action_ID}</td>
                            <td>{item.Action_Type}</td>
                            <td>{item.Timestamp}</td>
                            <td>{item.PIB}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Пагінація */}
            <div className="pagination">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                >
                    &lt;
                </button>
                <span className="current-page">
                    Сторінка {currentPage} з {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                >
                    &gt;
                </button>
            </div>

            {selectedAction && selectedAction.Action_Type === "Diagnose" && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>
                            &times;
                        </span>
                        <h2>Diagnose Details</h2>
                        {resultImage && (
                            <div id="image-container" style={{ position: "relative" }}>
                                <img
                                    src={resultImage}
                                    alt="Diagnose Result"
                                    style={{ display: "block", maxWidth: "100%" }}
                                />
                                {elementDetails.length > 0 ? (
                                    elementDetails
                                        .filter((el) => el.bbox)
                                        .map((el, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    position: "absolute",
                                                    left: `${el.bbox.x1}px`,
                                                    top: `${el.bbox.y1}px`,
                                                    width: `${el.bbox.x2 - el.bbox.x1}px`,
                                                    height: `${el.bbox.y2 - el.bbox.y1}px`,
                                                    border: "2px solid red",
                                                }}
                                            ></div>
                                        ))
                                ) : (
                                    <p style={{ color: "red" }}>No bounding boxes available.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default History;
