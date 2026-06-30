const Paths = {
  AUTH: {
    SIGN_IN: "auth/signin",
  },
  DASHBOARD_DATA: "data/",
  INCIDENT: "incident/",
  ROLES: "roles",
  INCIDENT_REGISTER: "incident/register",    // nuevo
  INTERVENTION: "intervention/",
  POSITIVE_REMARKS: "positive_remarks/",
  STUDENTS: {
    SEARCH: "students/search",
  },
  ADMIN: {
    INCIDENT_TYPE: "admin/incident_type",
    CASE_STATE: "admin/case_state",
    USER: "admin/user",
    USERS: "admin/users",
  },
} as const;

export default Paths;