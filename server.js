const inquirer = require('inquirer');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'Wealthy8!',
    database: 'employee_tracker_db',
    port: 5432

},
console.log("Connected to the database")
);
pool.connect();

function quit() {
    console.log("Goodbye");
    process.exit();
}
// start
function viewEmployees() {
    sqlQuery = `SELECT employee.id,employee.first_name,
    employee.last_name,
    role.title,
    department.name AS department,
    role.salary,
    CONCAT(manager.first_name, '', manager.last_name) AS manager
    FROM employee JOIN role on employee.role_id = role.id
    JOIN department on role.department_id = department.id
    JOIN employee manager on employee.manager_id = manager.id;`;
    pool.query(sqlQuery, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("\n");
        console.table(res.rows); 
        loadMainMenu();
    });
}

function viewEmployeesByDepartment() {
    let sqlQuery = 'SELECT * FROM department';
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const departmentChoices = results.rows.map(department => ({
            name: department.name,
            value: department.id
        }));

        inquirer.prompt([{
            type: 'list',
            name: 'departmentId',
            message: 'Which department would you like to see employees belong to?',
            choices: departmentChoices
        }]).then(({ departmentId }) => {
            sqlQuery = `SELECT DISTINCT employee.id, employee.first_name, employee.last_name, role.title
            FROM employee 
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id 
            WHERE department.id = $1;`;
            pool.query(sqlQuery, [departmentId], (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("\n");
                console.table(res.rows);
                loadMainMenu();
            });
        });
    });
}


function viewEmployeesByManager() {
    let sqlQuery = 'SELECT * FROM employee';
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
        }
        const managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name}, ${last_name}`,
            value: id,
        }));

        inquirer.prompt([{
            type: 'list',
            name: 'managerId',
            message: 'Which employee reporting structure would you like to view',
            choices: managerChoices,
        }])
        .then(({ managerId }) => {
            sqlQuery = `SELECT employee.manager_id, department.name, employee.first_name, employee.last_name 
            FROM employee
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id
            WHERE employee.manager_id = $1;`;
            pool.query(sqlQuery, [managerId], (err, results) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (results.rows.length === 0) {
                    console.log('Employee is not a manager.');
                } else {
                    console.log("\n");
                    console.table(results.rows);
                }
                loadMainMenu();
            });
        });
    });
}


// main menu function/prompt
function loadMainMenu() {
    inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'what would you like to do?',
        choices: [
            {
                name: "View all employees",
                value: "VIEW_EMPLOYEES"
            },{
                name: "View all employees by department",
                value: "VIEW_EMPLOYEES_BY_DEPARTMENT"
            },{
                name: "View all employees by manager",
                value: "VIEW_EMPLOYEES_BY_MANAGER",
            },{
                name: "Quit",
                value: "QUIT"
            }
        ]
    }]).then((answers) => {
        let { choice } = answers;
        if(answers.choice === "VIEW_EMPLOYEES") {
          viewEmployees();
        } else if (choice === "VIEW_EMPLOYEES_BY_DEPARTMENT") {
            viewEmployeesByDepartment();
        }
        else if (choice === "VIEW_EMPLOYEES_BY_MANAGER") {
            viewEmployeesByManager();
        }
        else {
            quit();
        }
        console.log(answers);
    })
}

function init(){
    console.log("Welcome to the Employee Management System");
    loadMainMenu();
}

init();