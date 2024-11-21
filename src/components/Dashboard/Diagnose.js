import React, { useState, useRef, useEffect } from "react";
import "../../styles/global.css";

function Diagnose() {
    const [image, setImage] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [elements, setElements] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(null);
    const imgRef = useRef(null);

    const pib = localStorage.getItem("pib");
    const userId = localStorage.getItem("user_id");

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!image) {
            alert("Please select an image.");
            return;
        }
    
        if (!userId) {
            alert("User ID is not found. Please log in again.");
            return;
        }
    
        const formData = new FormData();
        formData.append("image", image);
        formData.append("user_id", userId);
    
        try {
            const response = await fetch("http://localhost:5000/diagnose", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Server response:", data); // Додайте це для перевірки
                setResultImage(`http://localhost:5000/static/${data.result_image}`);
                setElements(data.combined_predictions || []);
            } else {
                throw new Error(data.error || "Upload failed.");
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };
    

    const handleMouseEnter = (index) => {
        setHighlightedIndex(index);
    };

    const handleMouseLeave = () => {
        setHighlightedIndex(null);
    };

    const adjustBoundingBoxes = () => {
        if (imgRef.current) {
            const image = imgRef.current;
            const scaleX = image.clientWidth / image.naturalWidth;
            const scaleY = image.clientHeight / image.naturalHeight;

            return elements.map((el) => ({
                left: el.bbox.x1 * scaleX,
                top: el.bbox.y1 * scaleY,
                width: (el.bbox.x2 - el.bbox.x1) * scaleX,
                height: (el.bbox.y2 - el.bbox.y1) * scaleY,
                color: getBoundingBoxColor(el.class),
            }));
        }
        return [];
    };

    const getBoundingBoxColor = (className) => {
        const redClasses = [
            "Dry_joint",
            "Incorrect_installation",
            "PCB_damage",
            "Short_circuit",
            "BLOCK ETCH",
            "COATING BAD",
            "PARTICLE",
            "PIQ PARTICLE",
            "PO CONTAMINATION",
            "SCRATCH",
            "SEZ BURNT",
            "particle",
            "scratch",
        ];

        const grayClasses = ["snap", "IC", "PCB", "capacitor", "resistor"];

        if (redClasses.includes(className)) {
            return "red";
        } else if (grayClasses.includes(className)) {
            return "rgba(128, 128, 128, 0.5)";
        }

        return "green";
    };

    useEffect(() => {
        adjustBoundingBoxes();
    }, [elements, resultImage]);

    const scaledBoxes = adjustBoundingBoxes();

    return (
        <div className="form-section">
            <h2>Diagnose</h2>
            <p>{pib}</p>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload and Diagnose</button>
            {resultImage && (
                <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div id="image-container" style={{ position: "relative", display: "inline-block" }}>
                        <img
                            src={resultImage}
                            alt="Uploaded"
                            id="result-image"
                            ref={imgRef}
                            style={{ display: "block", maxWidth: "100%" }}
                        />
                        {scaledBoxes.map((box, idx) => (
                            <div
                                key={idx}
                                className={`bounding-box ${
                                    highlightedIndex === idx ? "highlighted" : ""
                                }`}
                                style={{
                                    position: "absolute",
                                    left: `${box.left}px`,
                                    top: `${box.top}px`,
                                    width: `${box.width}px`,
                                    height: `${box.height}px`,
                                    border: `3px solid ${box.color}`,
                                    boxSizing: "border-box",
                                    pointerEvents: "none",
                                }}
                            ></div>
                        ))}
                    </div>
                    <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
                        <h4>Detected Elements:</h4>
                        <ul>
                            {elements.map((el, idx) => (
                                <li
                                    key={idx}
                                    onMouseEnter={() => handleMouseEnter(idx)}
                                    onMouseLeave={handleMouseLeave}
                                    style={{ cursor: "pointer", padding: "5px 0" }}
                                >
                                    <strong>Class:</strong> {el.class}
                                    <br />
                                    <strong>Coordinates:</strong> {JSON.stringify(el.bbox)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Diagnose;
