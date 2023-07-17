const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, isValid } = require("date-fns");
var toDate = require("date-fns/toDate");

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

const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

//API 1
app.get("/todos/", async (request, response) => {
  const { category, status, priority, search_q = "" } = request.query;
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
      if (statusArray.includes(status)) {
        getTodoQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
        return;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (priorityArray.includes(priority)) {
        getTodoQuery = `
                SELECT 
                    * 
                FROM 
                    todo 
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';
                `;
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
        return;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.query):
      if (categoryArray.includes(category)) {
        getTodoQuery = `
                SELECT 
                    * 
                FROM 
                    todo 
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND category = '${category}';
                `;
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
        return;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (categoryArray.includes(category) && statusArray.includes(status)) {
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
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
        return;
      } else if (categoryArray.includes(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      } else if (statusArray.includes(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        categoryArray.includes(category) &&
        priorityArray.includes(priority)
      ) {
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
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
        return;
      } else if (categoryArray.includes(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      } else if (priorityArray.includes(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndStatus(request.query):
      if (statusArray.includes(status) && priorityArray.includes(priority)) {
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
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
        return;
      } else if (statusArray.includes(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      } else if (priorityArray.includes(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodoQuery = `
                    SELECT
                        *
                    FROM
                        todo 
                    WHERE
                        todo LIKE '%${search_q}%';`;
      const data = await db.all(getTodoQuery);
      response.send(
        data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
  }
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

//API 3
app.get("/agenda/", (request, response) => {
  const { date } = request.query;
  const formattedDate = format(new Date(date), "yyyy-MM-dd");
  const isValidDate = (formattedDate) => {
    return isValid(toDate(formattedDate));
  };
  console.log(isValidDate);
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const hasValidStatus = (requestBody) => {
    return requestBody.status !== undefined && statusArray.includes(status);
  };
  const hasValidPriority = (requestBody) => {
    return (
      requestBody.priority !== undefined && priorityArray.includes(priority)
    );
  };
  const hasValidCategory = (requestBody) => {
    return (
      requestBody.category !== undefined && categoryArray.includes(category)
    );
  };
  const hasValidDueDate = (requestBody) => {
    if (requestBody.dueDate !== undefined) {
      const formattedDate = format(requestBody.dueDate, "yyyy-MM-dd");
      return isValid(formattedDate, "yyyy-MM-dd");
    }
  };

  if (!hasValidStatus(request.body)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!hasValidPriority(request.body)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!hasValidCategory(request.body)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (!hasValidDueDate(request.body)) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const addTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES 
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');
        `;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  }
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
    case hasTodo(request.body):
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    todo = '${todo}'
                WHERE 
                    id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case hasStatus(request.body):
      if (statusArray.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      } else {
        updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    status = '${status}'
                WHERE 
                    id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      }
      break;

    case hasPriority(request.body):
      if (priorityArray.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      } else {
        updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    priority = '${priority}'
                WHERE 
                    id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      }
      break;

    case hasCategory(request.body):
      if (categoryArray.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      } else {
        updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    category = '${category}'
                WHERE 
                    id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      }
      break;

    case hasDueDate(request.body):
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        SELECT 
            * 
        FROM 
            todo 
        WHERE   
            id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
