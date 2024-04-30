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

function viewEmployeesByDepartment() {
    let sqlQuery = 'SELECT * FROM department';
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
        }
        const departmentChoices = results.row.map(department => ({
            name: department.name,
            value: department.id
        }));
        
        inquirer.prompt([{
            type: 'list',
            name: 'departmentId',
            message: 'Which department would you like to see employee for?',
            choices: departmentChoices
        }]).then(({ departmentId }) => {
            sqlQuery = `SELECT * FROM department WHERE id = $1`;
            pool.query(sqlQuery, [departmentId], (err, res) => {
                console.log("\n");
                console.table(results.row);
                loadMainMenu();
            });
        });
    });
}

function loadMainMenu() {
    inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'what would you like to do?',
        choices: [
            {
                name: "View all employeess",
                value: "VIEW_EMPLOYEES"
            },{
                name: "View all employees by department",
                value: "VIEW_EMPLOYEES_BY_DEPARTMENT"
            },,{
                name: "View emplo",
                value: "QUIT"
            },{
                name: "Quit",
                value: "QUIT"
            }
        ]
    }]).then((answers) => {
        let { choice } = answers
        if(answers.choice === "VIEW_EMPLOYEES") {
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
            
        } else {
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