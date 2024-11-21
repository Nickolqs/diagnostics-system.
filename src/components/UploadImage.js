import React, { useState } from "react";
import "../styles/global.css";

const UploadImage = () => {
  const [image, setImage] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [split, setSplit] = useState("train");
  const [tag, setTag] = useState("");
  const [message, setMessage] = useState("");

  const handleImageUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", image);
    if (batchName) formData.append("batch_name", batchName);
    formData.append("split", split);
    if (tag) formData.append("tag", tag);

    try {
      const response = await fetch("http://localhost:5000/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setMessage(data.message || "Upload successful!");
    } catch (error) {
      console.error("Error uploading the image:", error);
      setMessage("Upload failed.");
    }
  };

  return (
    <div>
      <h1>Upload an Image to Roboflow</h1>
      <form onSubmit={handleImageUpload} encType="multipart/form-data">
        <label>
          Select Image:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </label>
        <br />
        <label>
          Batch Name (Optional):
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
        </label>
        <br />
        <label>
          Split:
          <select value={split} onChange={(e) => setSplit(e.target.value)}>
            <option value="train">Train</option>
            <option value="valid">Validation</option>
            <option value="test">Test</option>
          </select>
        </label>
        <br />
        <label>
          Tag (Optional):
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadImage;
