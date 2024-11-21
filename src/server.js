const express = require("express");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = 5000;

// Шлях до бази даних
const dbPath = path.join(__dirname, "database", "diagnostics.db");

// Ініціалізація бази даних
function initializeDatabase() {
    if (!fs.existsSync(dbPath)) {
        console.log("Database file not found. Creating a new one...");
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error("Error creating database:", err.message);
                process.exit(1);
            }
        });

        const sqlScript = `
       -- Таблиця користувачів
        CREATE TABLE IF NOT EXISTS Users (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            PIB TEXT NOT NULL,
            Login TEXT NOT NULL UNIQUE,
            Password TEXT NOT NULL,
            Posada TEXT NOT NULL
        );

        -- Таблиця для фіксації дій користувачів
        CREATE TABLE IF NOT EXISTS UserActions (
            Action_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            User_ID INTEGER NOT NULL,
            Action_Type TEXT NOT NULL, -- Тип дії: "Diagnose" або "Train"
            Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (User_ID) REFERENCES Users(ID)
        );

        -- Таблиця фотографій
        CREATE TABLE IF NOT EXISTS Photo (
            Photo_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Path_to_file TEXT NOT NULL,
            Mark TEXT,
            Format TEXT NOT NULL
        );

        -- Таблиця результатів
        CREATE TABLE IF NOT EXISTS Result (
            Result_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Photo_ID INTEGER NOT NULL,
            Class_ID INTEGER NOT NULL,
            Action_ID INTEGER NOT NULL, -- Посилання на дію користувача
            FOREIGN KEY (Photo_ID) REFERENCES Photo(Photo_ID),
            FOREIGN KEY (Class_ID) REFERENCES Class(Class_ID),
            FOREIGN KEY (Action_ID) REFERENCES UserActions(Action_ID)
        );


        -- Таблиця дій    
            CREATE TABLE IF NOT EXISTS history (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            User_ID INTEGER NOT NULL,
            Action TEXT NOT NULL, -- Наприклад, "diagnose", "train"
            Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (User_ID) REFERENCES Users(ID)
        );

        -- Таблиця тензорів
        CREATE TABLE IF NOT EXISTS Tensor (
            Tensor_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Photo_ID INTEGER NOT NULL,
            x_coord REAL NOT NULL,
            y_coord REAL NOT NULL,
            width REAL NOT NULL,
            height REAL NOT NULL,
            p_obj REAL NOT NULL,
            FOREIGN KEY (Photo_ID) REFERENCES Photo(Photo_ID)
        );

        -- Таблиця ймовірностей для тензорів
        CREATE TABLE IF NOT EXISTS TensorClasses (
            Tensor_ID INTEGER NOT NULL,
            Class_ID INTEGER NOT NULL,
            Probability REAL NOT NULL,
            FOREIGN KEY (Tensor_ID) REFERENCES Tensor(Tensor_ID),
            FOREIGN KEY (Class_ID) REFERENCES Class(Class_ID)
        );

        -- Таблиця класів
        CREATE TABLE IF NOT EXISTS Class (
            Class_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Component_Class_ID INTEGER NOT NULL,
            Component_Class TEXT NOT NULL,
            State_Class_ID INTEGER NOT NULL,
            State_Class TEXT NOT NULL
        );

        `;

        db.exec(sqlScript, (err) => {
            if (err) {
                console.error("Error initializing database:", err.message);
                process.exit(1);
            } else {
                console.log("Database structure initialized successfully.");

                const hashedPassword = bcrypt.hashSync("admin", 10);
                db.run(
                    "INSERT INTO Users (PIB, Login, Password, Posada) VALUES (?, ?, ?, ?)",
                    ["Nicolas", "admin", hashedPassword, "Engineer"],
                    (err) => {
                        if (err) {
                            console.error("Error adding user Nicolas:", err.message);
                        } else {
                            console.log("User 'Nicolas' added successfully.");
                        }
                    }
                );
            }
        });

        db.close();
    } else {
        console.log("Database file already exists.");
    }
}

// Виклик ініціалізації бази даних
initializeDatabase();

// Конфігурація для завантаження файлів
const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 10 * 1024 * 1024 }, // Максимальний розмір файлу 10MB
});

// Middleware
app.use(express.json());
app.use(cors());
app.use("/static", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../build")));

// Логін користувача
app.post("/login", (req, res) => {
    const { login, password } = req.body;

    console.log("Received login request:", { login, password });

    if (!login || !password) {
        return res.status(400).send({ error: "Both login and password are required" });
    }

    const db = new sqlite3.Database(dbPath);
    db.get("SELECT * FROM Users WHERE Login = ?", [login], (err, user) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send({ error: "Internal server error" });
        }

        if (!user) {
            console.log("User not found:", login);
            return res.status(404).send({ error: "User not found" });
        }

        console.log("Login successful. User data:", user);

        const isPasswordValid = bcrypt.compareSync(password, user.Password);
        if (!isPasswordValid) {
            console.log("Invalid credentials for user:", login);
            return res.status(401).send({ error: "Invalid credentials" });
        }

        // Встановлюємо user_id у cookie
        res.cookie("user_id", user.ID, {
            httpOnly: true, // Захист від XSS
            secure: false, // У продакшені встановити true для HTTPS
            maxAge: 24 * 60 * 60 * 1000, // Термін дії cookie — 1 день
        });

        res.status(200).send({
            message: "Login successful",
            user: { ID: user.ID, PIB: user.PIB, Login: user.Login, Posada: user.Posada },
        });
    });
    db.close();
});





// Отримання профілю користувача
app.get("/profile", (req, res) => {
    const userId = req.headers.authorization; // ID користувача, отриманий із заголовків

    if (!userId) {
        return res.status(400).send({ error: "User ID is required" });
    }

    const db = new sqlite3.Database(dbPath);
    db.get("SELECT ID, PIB AS name, Login AS login, Posada AS role FROM Users WHERE ID = ?", [userId], (err, row) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send({ error: "Internal server error" });
        }

        if (!row) {
            return res.status(404).send({ error: "User not found" });
        }

        res.status(200).send(row);
    });
    db.close();
});

// Оновлення профілю користувача
app.post("/profile/update", (req, res) => {
    const { ID, name, login, role } = req.body;

    console.log("Received profile update request:", { ID, name, login, role }); // Лог

    if (!ID || !name || !login || !role) {
        return res.status(400).send({ error: "All fields are required" });
    }

    const db = new sqlite3.Database(dbPath);
    db.run(
        "UPDATE Users SET PIB = ?, Login = ?, Posada = ? WHERE ID = ?",
        [name, login, role, ID],
        (err) => {
            if (err) {
                console.error("Error updating profile:", err.message);
                return res.status(500).send({ error: "Failed to update profile" });
            }

            res.status(200).send({ message: "Profile updated successfully" });
        }
    );
    db.close();
});





// Додавання нового користувача
app.post("/users/add", (req, res) => {
    const { name, login, password, role } = req.body;

    if (!name || !login || !password || !role) {
        return res.status(400).send({ error: "All fields are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const db = new sqlite3.Database(dbPath);
    db.run(
        "INSERT INTO Users (PIB, Login, Password, Posada) VALUES (?, ?, ?, ?)",
        [name, login, hashedPassword, role],
        (err) => {
            if (err) {
                console.error("Error adding user:", err.message);
                return res.status(500).send({ error: "Failed to add user" });
            }

            res.status(201).send({ message: "User added successfully" });
        }
    );
    db.close();
});



// Завантаження зображення та діагностика через Roboflow
const calculateBoundingBox = (prediction) => {
    return {
        x1: prediction.x - prediction.width / 2,
        y1: prediction.y - prediction.height / 2,
        x2: prediction.x + prediction.width / 2,
        y2: prediction.y + prediction.height / 2,
    };
};

app.post("/diagnose", upload.single("image"), async (req, res) => {
    const { user_id } = req.body; // Extract user_id from the request body

    if (!req.file) {
        return res.status(400).send({ error: "Image file is required" });
    }

    if (!user_id) {
        return res.status(400).send({ error: "User ID is required" });
    }

    console.log("User ID:", user_id); // Log for debugging
    console.log("Uploaded file info:", req.file); // Log uploaded file info

    const uploadDir = path.join(__dirname, "uploads");
    const imagePath = req.file.path;
    const resultImagePath = `${req.file.filename}_result.png`; // Append result suffix and extension
    const fullResultPath = path.join(uploadDir, resultImagePath);

    try {
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Rename the uploaded file to include extension
        if (!fs.existsSync(fullResultPath)) {
            fs.renameSync(imagePath, fullResultPath);
            console.log(`File renamed to: ${resultImagePath}`);
        }

        // Read and encode the image
        const imageBase64 = fs.readFileSync(fullResultPath, { encoding: "base64" });

        // Define the models
        const models = [
            { name: "Model 1", url: "https://detect.roboflow.com/electronic-components-d6uul/2", apiKey: "JOTuOytSrdYW5mjK2eqP" },
            { name: "Model 2", url: "https://outline.roboflow.com/defects-2q87r/8", apiKey: "JOTuOytSrdYW5mjK2eqP" },
            { name: "Model 3", url: "https://outline.roboflow.com/wafer-defect-rv1vx/2", apiKey: "JOTuOytSrdYW5mjK2eqP" },
            { name: "Model 4", url: "https://outline.roboflow.com/yolo7-uhkof/1", apiKey: "JOTuOytSrdYW5mjK2eqP" },
            { name: "Model 5", url: "https://detect.roboflow.com/damage2-htjon/1", apiKey: "JOTuOytSrdYW5mjK2eqP" },
        ];

        // Perform inference across all models
        const results = await Promise.all(
            models.map(async (model) => {
                try {
                    const response = await axios({
                        method: "POST",
                        url: model.url,
                        params: { api_key: model.apiKey },
                        data: imageBase64,
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    });

                    return {
                        model: model.name,
                        predictions: response.data.predictions || [],
                    };
                } catch (error) {
                    console.error(`Error during inference for ${model.name}:`, error.message);
                    return { model: model.name, predictions: [], error: error.message };
                }
            })
        );

        // Combine predictions from all models
        const combinedPredictions = results.flatMap((result) =>
            result.predictions.map((pred) => ({
                model: result.model,
                class: pred.class,
                bbox: calculateBoundingBox(pred),
                confidence: pred.confidence || 0,
            }))
        );

        const db = new sqlite3.Database(dbPath);

        console.log(
            "SQL Query: INSERT INTO Photo (Path_to_file, Format) VALUES (?, ?)",
            resultImagePath,
            req.file.mimetype
        );

        // Verify user exists in the database
        db.get("SELECT ID FROM Users WHERE ID = ?", [user_id], function (err, user) {
            if (err) {
                console.error("Database error while fetching user:", err.message);
                db.close();
                return res.status(500).send({ error: "Internal server error" });
            }

            if (!user) {
                console.error("User not found in the database.");
                db.close();
                return res.status(404).send({ error: "User not found" });
            }

            // Insert the photo into the database
            db.run(
                "INSERT INTO Photo (Path_to_file, Format) VALUES (?, ?)",
                [resultImagePath, req.file.mimetype],
                function (photoErr) {
                    if (photoErr) {
                        console.error("Error saving photo:", photoErr.message);
                        db.close();
                        return res.status(500).send({ error: "Error saving photo" });
                    }

                    const photoId = this.lastID;

                    // Insert tensors for each bounding box
                    const tensorInsertPromises = combinedPredictions.map((pred) => {
                        return new Promise((resolve, reject) => {
                            db.run(
                                "INSERT INTO Tensor (Photo_ID, x_coord, y_coord, width, height, p_obj) VALUES (?, ?, ?, ?, ?, ?)",
                                [
                                    photoId,
                                    pred.bbox.x1,
                                    pred.bbox.y1,
                                    pred.bbox.x2 - pred.bbox.x1,
                                    pred.bbox.y2 - pred.bbox.y1,
                                    pred.confidence,
                                ],
                                (tensorErr) => {
                                    if (tensorErr) reject(tensorErr);
                                    else resolve();
                                }
                            );
                        });
                    });

                    // Save tensors and log the action
                    Promise.all(tensorInsertPromises)
                        .then(() => {
                            db.run(
                                "INSERT INTO UserActions (User_ID, Action_Type) VALUES (?, ?)",
                                [user_id, "Diagnose"],
                                (actionErr) => {
                                    if (actionErr) {
                                        console.error("Error logging action:", actionErr.message);
                                        db.close();
                                        return res
                                            .status(500)
                                            .send({ error: "Error logging user action" });
                                    }

                                    db.close();
                                    res.status(200).send({
                                        message: "Image diagnosed successfully across multiple models!",
                                        result_image: resultImagePath,
                                        combined_predictions: combinedPredictions,
                                    });
                                }
                            );
                        })
                        .catch((err) => {
                            console.error("Error saving tensors:", err.message);
                            db.close();
                            res.status(500).send({ error: "Error saving tensors" });
                        });
                }
            );
        });
    } catch (error) {
        console.error("Error during model inference:", error.message);
        res.status(500).send({ error: "Error during inference", details: error.message });
    }
});



// Історія дій
app.get("/history", (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).send({ error: "User ID is required" });
    }

    const db = new sqlite3.Database(dbPath);

    db.all(
        `
        SELECT 
            UserActions.Action_ID,
            UserActions.Action_Type,
            UserActions.Timestamp,
            Users.PIB
        FROM UserActions
        JOIN Users ON Users.ID = UserActions.User_ID
        WHERE UserActions.User_ID = ?
        `,
        [user_id],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send({ error: "Internal server error" });
            }

            if (!rows.length) {
                return res.status(404).send({ error: "No actions found for this user." });
            }

            res.status(200).send(rows);
        }
    );

    db.close();
});

app.get("/diagnose-details", (req, res) => {
    const { action_id } = req.query;

    if (!action_id) {
        return res.status(400).send({ error: "Action ID is required" });
    }

    const db = new sqlite3.Database(dbPath);

    db.get(
        `
        SELECT 
            Photo.Path_to_file AS result_image,
            json_group_array(
                json_object(
                    'x1', Tensor.x_coord,
                    'y1', Tensor.y_coord,
                    'x2', Tensor.x_coord + Tensor.width,
                    'y2', Tensor.y_coord + Tensor.height,
                    'confidence', Tensor.p_obj
                )
            ) AS element_details
        FROM UserActions
        JOIN Photo ON UserActions.Action_ID = Photo.Photo_ID
        JOIN Tensor ON Photo.Photo_ID = Tensor.Photo_ID
        WHERE UserActions.Action_ID = ?
        GROUP BY Photo.Photo_ID
        `,
        [action_id],
        (err, row) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send({ error: "Internal server error" });
            }

            if (!row) {
                return res.status(404).send({ error: "No details found for this action ID." });
            }

            res.status(200).send({
                result_image: row.result_image,
                element_details: JSON.parse(row.element_details),
            });
        }
    );

    db.close();
});



// Обробка React-маршрутів
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
