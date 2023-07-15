const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format } = require("date-fns");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const { category, status, priority, search_q = "" } = request.query;

  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const categoryArray = ["WORK", "HOME", "LEARNING"];

  let getTodoQuery = "";

  const hasStatus = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  const hasPriority = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasCategory = (requestQuery) => {
    return requestQuery.category !== undefined;
  };
  const hasPriorityAndStatus = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const hasCategoryAndStatus = (requestQuery) => {
    return (
      requestQuery.category !== undefined && requestQuery.status !== undefined
    );
  };
  const hasCategoryAndPriority = (requestQuery) => {
    return (
      requestQuery.category !== undefined && requestQuery.priority !== undefined
    );
  };

  switch (true) {
    case hasStatus(request.query):
      if (statusArray.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        getTodoQuery = `
                    SELECT 
                        * 
                    FROM 
                        todo 
                    WHERE 
                        todo LIKE '%${search_q}%'
                        AND status = '${status}';
                    `;
        break;
      }
    case hasPriority(request.query):
      if (priorityArray.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        getTodoQuery = `
                    SELECT 
                        * 
                    FROM 
                        todo 
                    WHERE 
                        todo LIKE '%${search_q}%'
                        AND priority = '${priority}';
                    `;
        break;
      }
    case hasCategory(request.query):
      if (categoryArray.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        getTodoQuery = `
                    SELECT 
                        * 
                    FROM 
                        todo 
                    WHERE 
                        todo LIKE '%${search_q}%'
                        AND category = '${category}';
                    `;
        break;
      }
    case hasCategoryAndStatus(request.query):
      if (
        categoryArray.includes(category) === false ||
        statusArray.includes(status) === false
      ) {
        response.status(400);
        if (categoryArray.includes(category) === false) {
          response.send("Invalid Todo Category");
        }
        if (statusArray.includes(status) === false) {
          response.send("Invalid Todo Status");
        }
      } else {
        getTodoQuery = `
                    SELECT 
                        * 
                    FROM 
                        todo 
                    WHERE 
                        todo LIKE '%${search_q}%'
                        AND category = '${category}'
                        AND status = '${status}';
                    `;
        break;
      }
    case hasCategoryAndPriority(request.query):
      if (
        categoryArray.includes(category) === false ||
        priorityArray.includes(priority) === false
      ) {
        response.status(400);
        if (categoryArray.includes(category) === false) {
          response.send("Invalid Todo Category");
        }
        if (priorityArray.includes(priority) === false) {
          response.send("Invalid Todo Priority");
        }
      } else {
        getTodoQuery = `
                    SELECT 
                        * 
                    FROM 
                        todo 
                    WHERE 
                        todo LIKE '%${search_q}%'
                        AND category = '${category}'
                        AND priority = '${priority}';
                    `;
        break;
      }
    case hasPriorityAndStatus(request.query):
      if (
        priorityArray.includes(priority) === false ||
        statusArray.includes(status) === false
      ) {
        response.status(400);
        if (statusArray.includes(status) === false) {
          response.send("Invalid Todo Status");
        }
        if (priorityArray.includes(priority) === false) {
          response.send("Invalid Todo Priority");
        }
      } else {
        getTodoQuery = `
                    SELECT 
                        * 
                    FROM 
                        todo 
                    WHERE 
                        todo LIKE '%${search_q}%'
                        AND status = '${status}'
                        AND priority = '${priority}';
                    `;
        break;
      }
    default:
      getTodoQuery = `
                    SELECT
                        *
                    FROM
                        todo 
                    WHERE
                        todo LIKE '%${search_q}%';`;
  }
  const data = await db.all(getTodoQuery);
  response.send(
    data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});

//API 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoByIdQuery = `
    SELECT 
        * 
    FROM 
        todo 
    WHERE 
        id = ${todoId};`;

  const data = await db.get(getTodoByIdQuery);
  response.send(convertDbObjectToResponseObject(data));
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const addTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES 
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');
        `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, status, priority, category, dueDate } = request.body;
  let updateTodoQuery = "";
  let responseText = "";

  const hasTodo = (requestBody) => {
    return requestBody.todo !== undefined;
  };
  const hasStatus = (requestBody) => {
    return requestBody.status !== undefined;
  };
  const hasPriority = (requestBody) => {
    return requestBody.priority !== undefined;
  };
  const hasCategory = (requestBody) => {
    return requestBody.category !== undefined;
  };
  const hasDueDate = (requestBody) => {
    return requestBody.dueDate !== undefined;
  };

  switch (true) {
    case hasTodo:
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    todo = '${todo}'
                WHERE 
                    id = ${todoId};`;
      responseText = "Todo Updated";
      break;

    case hasStatus:
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    status = '${status}'
                WHERE 
                    id = ${todoId};`;
      responseText = "Status Updated";
      break;

    case hasPriority:
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    priority = '${priority}'
                WHERE 
                    id = ${todoId};`;
      responseText = "Priority Updated";
      break;

    case hasCategory:
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    category = '${category}'
                WHERE 
                    id = ${todoId};`;
      responseText = "Category Updated";
      break;

    case hasDueDate:
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;
      responseText = "Due Date Updated";
      break;
  }
  await db.run(updateTodoQuery);
  response.send(responseText);
});

module.exports = app;
