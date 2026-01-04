
-- =========================
-- ENUM TYPES
-- =========================

CREATE TYPE user_role AS ENUM ('Employee', 'HR', 'Admin');

CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Half-day', 'Leave');

CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TYPE leave_type AS ENUM ('Paid', 'Sick', 'Unpaid', 'Maternity');


-- =========================
-- EMPLOYEES TABLE
-- =========================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    role user_role NOT NULL DEFAULT 'Employee',
    is_verified BOOLEAN NOT NULL DEFAULT true,

    employee_id VARCHAR(50) UNIQUE NOT NULL,
    position VARCHAR(255),
    department VARCHAR(255),

    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,

    contact_number VARCHAR(50),
    address TEXT,
    avatar_url TEXT,

    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- ATTENDANCE RECORDS
-- =========================

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    record_date DATE NOT NULL,
    status attendance_status NOT NULL,

    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,

    UNIQUE (employee_id, record_date)
);

CREATE INDEX idx_attendance_employee_date
ON attendance_records (employee_id, record_date);


-- =========================
-- LEAVE REQUESTS
-- =========================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    reason TEXT,
    status leave_status NOT NULL DEFAULT 'Pending',
    admin_comments TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leave_employee
ON leave_requests (employee_id);


-- =========================
-- PAYROLL INFORMATION
-- =========================

CREATE TABLE payroll_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    basic_salary NUMERIC(12, 2) NOT NULL,
    hra NUMERIC(10, 2),
    other_allowances NUMERIC(10, 2),
    pf_deduction NUMERIC(10, 2),
    tax_deduction NUMERIC(10, 2),

    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
