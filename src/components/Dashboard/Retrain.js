import React, { useState } from "react";
import axios from "axios";
import "../../styles/global.css";

const Retrain = () => {
    const [images, setImages] = useState([]);
    const [annotations, setAnnotations] = useState(null);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState(0);

    const handleImageChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    const handleAnnotationChange = (e) => {
        setAnnotations(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!images.length || !annotations) {
            setMessage("Please upload both images and annotations.");
            return;
        }

        const formData = new FormData();

        // Додавання зображень до FormData
        images.forEach((image, index) => {
            formData.append("file", image);
            formData.append("name", image.name || `image_${index}.jpg`);
            formData.append("split", "train"); // Ви можете змінити "split" на "validation" або "test" за потреби
        });

        // Додавання анотацій до FormData
        formData.append("annotations", annotations);

        try {
            // Відправлення даних на Roboflow API
            const response = await axios.post(
                "https://api.roboflow.com/dataset/YOUR_DATASET_NAME/upload",
                formData,
                {
                    params: {
                        api_key: "JOTuOytSrdYW5mjK2eqP", // Заміни на свій ключ API
                    },
                    headers: formData.getHeaders
                        ? formData.getHeaders()
                        : { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    },
                }
            );

            if (response.data.success) {
                setMessage("Retraining started successfully!");
            } else {
                setMessage(
                    `Error: ${response.data.message || "Unable to start retraining."}`
                );
            }
        } catch (error) {
            console.error("Error retraining model:", error);
            setMessage(
                `Error starting retraining: ${
                    error.response?.data?.message || error.message
                }`
            );
        }
    };

    return (
        <div className="form-section">
            <h1>Retrain Model</h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <label>
                    Upload Images:
                    <input
                        type="file"
                        multiple
                        onChange={handleImageChange}
                        accept="image/*"
                    />
                </label>
                <br />
                <label>
                    Upload Annotations (COCO JSON):
                    <input
                        type="file"
                        onChange={handleAnnotationChange}
                        accept=".json"
                    />
                </label>
                <br />
                <button type="submit">Start Retraining</button>
            </form>
            {progress > 0 && progress < 100 && (
                <p>Uploading... {progress}% completed</p>
            )}
            {message && <p>{message}</p>}
        </div>
    );
};

export default Retrain;
