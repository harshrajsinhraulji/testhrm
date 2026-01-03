
// A simple mapping for predefined salaries based on department and role.
// In a real-world scenario, this might come from a database or a more complex configuration file.

interface SalaryDefaults {
    basic: number;
    hra: number; // House Rent Allowance
    otherAllowances: number;
    pf: number; // Provident Fund
}

const salaryMap: Record<string, Record<string, SalaryDefaults>> = {
    "Engineering": {
        "Software Engineer":    { basic: 60000, hra: 15000, otherAllowances: 5000, pf: 3000 },
        "Senior Software Engineer": { basic: 90000, hra: 25000, otherAllowances: 10000, pf: 5000 },
        "Team Lead":            { basic: 120000, hra: 30000, otherAllowances: 15000, pf: 7000 },
    },
    "Product": {
        "Product Manager": { basic: 85000, hra: 22000, otherAllowances: 8000, pf: 4500 },
    },
    "Design": {
        "UX/UI Designer": { basic: 65000, hra: 16000, otherAllowances: 6000, pf: 3500 },
    },
    "Sales": {
        "Sales Development Representative": { basic: 50000, hra: 12000, otherAllowances: 4000, pf: 2500 },
    },
    "Marketing": {
        "Marketing Manager": { basic: 75000, hra: 18000, otherAllowances: 7000, pf: 4000 },
    },
    "Human Resources": {
        "HR Generalist": { basic: 55000, hra: 14000, otherAllowances: 5000, pf: 3000 },
    },
    "Finance": {
        "Accountant": { basic: 60000, hra: 15000, otherAllowances: 5000, pf: 3000 },
    },
    "Customer Support": {
        "Customer Support Specialist": { basic: 45000, hra: 10000, otherAllowances: 3000, pf: 2000 },
    },
    "default": {
        "default": { basic: 40000, hra: 8000, otherAllowances: 2000, pf: 1500 },
    }
};

export function getPredefinedSalary(department: string, position: string): SalaryDefaults {
    return salaryMap[department]?.[position] || salaryMap.default.default;
}
