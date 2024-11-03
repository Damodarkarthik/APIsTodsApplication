const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json()); // To parse JSON request bodies

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

// Initialize Database and Server
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.error(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

// Call the initialization function
initializeDbAndServer();

// Example route to verify connection
app.get("/", (request, response) => {
  response.send("Server and Database are connected successfully!");
});

const hasStatusAndPriorityCheckProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatusCheckProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityCheckProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let getQuery;
  switch (true) {
    case hasStatusAndPriorityCheckProperties(request.query):
      getQuery = `select * from todo where todo LIKE '%${search_q}%' and status = '${status}' and priority = '${priority}';`;
      break;
    case hasStatusCheckProperty(request.query):
      getQuery = `select * from todo where todo LIKE '%${search_q}%' and status = '${status}';`;
      break;
    case hasPriorityCheckProperty(request.query):
      getQuery = `select * from todo where todo LIKE '%${search_q}%' and priority = '${priority}';`;
      break;
    default:
      getQuery = `select * from todo where todo LIKe '%${search_q}%';`;
      break;
  }
  let data = await db.all(getQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

//API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { todo, priority, status } = todoDetails;
  const getAddTodoQuery = `INSERT INTO todo (todo, priority, status) values('${todo}', '${priority}', '${status}');`;
  await db.run(getAddTodoQuery);
  response.send("successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;

  let updateQuery = "";
  let updates = [];

  // Check which fields are present in the request and add to update statement
  if (status) {
    updates.push(`status = '${status}'`);
  }
  if (priority) {
    updates.push(`priority = '${priority}'`);
  }
  if (todo) {
    updates.push(`todo = '${todo}'`);
  }

  // Construct the update query based on provided fields
  if (updates.length > 0) {
    updateQuery = `
      UPDATE todo 
      SET ${updates.join(", ")} 
      WHERE id = ${todoId};
    `;
    await db.run(updateQuery);
    response.send("Todo Updated Successfully");
  } else {
    response.status(400).send("No valid fields provided for update");
  }
});
