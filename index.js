const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const { ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qtgfrql.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const userCollection = client.db("TaskManage").collection("users");
        const AllTaskCollection = client.db("TaskManage").collection("AllTask");

        // --------------------------------------------------------------------

        // user related
        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({
                    message: "user already exists",
                    insertedId: null,
                });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        // task history related
        app.post("/AllTask", async (req, res) => {
            const task = req.body;
            const result = await AllTaskCollection.insertOne(task);

            if (result.insertedId) {
                res.send({
                    message: "Task added successfully",
                    taskId: result.insertedId,
                });
            } else {
                res.status(500).send({
                    message: "Failed to add task",
                    taskId: null,
                });
            }
        });

        // Get all tasks by user email
        app.get("/AllTask", async (req, res) => {
            const result = await AllTaskCollection.find().toArray();
            res.send(result);
        });

        app.delete("/AllTask/:taskId", async (req, res) => {
            const taskId = req.params.taskId; // Fix this line
            const query = { _id: new ObjectId(taskId) };
            const result = await AllTaskCollection.deleteOne(query);
            res.send(result);
        });

        app.get("/Alltask/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AllTaskCollection.findOne(query);
            if (result) {
                res.send(result);
            } else {
                res.status(404).send("Review not found");
            }
        });

        app.put("/AllTask/:taskId", async (req, res) => {
            try {
                const taskId = req.params.taskId;
                const updatedTaskData = req.body;

                if (
                    !updatedTaskData.title ||
                    !updatedTaskData.description ||
                    !updatedTaskData.deadline ||
                    !updatedTaskData.priority
                ) {
                    return res
                        .status(400)
                        .send({ message: "Incomplete task data provided" });
                }

                const query = { _id: new ObjectId(taskId) };
                const update = {
                    $set: {
                        title: updatedTaskData.title,
                        description: updatedTaskData.description,
                        deadline: updatedTaskData.deadline,
                        priority: updatedTaskData.priority,
                    },
                };

                const result = await AllTaskCollection.updateOne(query, update);

                if (result.modifiedCount === 1) {
                    res.send({ message: "Task updated successfully" });
                } else {
                    res.status(404).send({
                        message: "Task not found or no modifications made",
                    });
                }
            } catch (error) {
                console.error("Error updating task:", error);
                res.status(500).send({ message: "Internal server error" });
            }
        });

        // app.put("/AllTask/status", async (req, res) => {
        //     try {
        //         const { taskId, status } = req.body;
        //         const query = { _id: new ObjectId(taskId) };
        //         const update = { $set: { status } };
        //         const result = await AllTaskCollection.updateOne(query, update);

        //         if (result.modifiedCount === 1) {
        //             res.send({ message: "Task status updated successfully" });
        //         } else {
        //             res.status(500).send({
        //                 message: "Failed to update task status",
        //             });
        //         }
        //     } catch (error) {
        //         console.error("Error updating task status:", error);
        //         res.status(500).send({ message: "Internal server error" });
        //     }
        // });

        // Error handler middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).send("Something went wrong!");
        });

        // ---------------------------------------

        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("TaskManger ready.......................");
});

app.listen(port, () => {
    console.log(`task Ready on port ${port}`);
});
