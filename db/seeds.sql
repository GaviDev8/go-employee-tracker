\c employee_tracker_db

INSERT INTO department (name)
VALUES  ('Sales'),
        ('Engineering'),
        ('Administrative'),
        ('Product'),
        ('Finance');

INSERT INTO role (title, salary, department_id)
VALUES  ('Solution Architect', 180000, 1),
        ('Software Engineer', 220000, 2),
        ('Administrative Assistant', 120000, 3),
        ('Product Manager', 170000, 4),
        ('Account Manager', 100000, 1),
        ('Sr. Software Engineer', 100000, 2),
        ('Accountant', 130000, 5);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES  ('Gabriela', 'Ortiz', 1, NULL),
        ('Spongebob', 'Squarepants', 2, 6),
        ('Scooby', 'Doo', 3, 1),
        ('Timmy', 'Turner', 4, 1),
        ('Betty', 'Bop', 5, 1),
        ('Bruce', 'Wayne', 6, 1),
        ('Dafy', 'Duck', 7, 1);
