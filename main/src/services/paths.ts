const Paths = {
  AUTH: {
    SIGN_IN: "auth/signin",
  },
  DASHBOARD_DATA: "data/",
  INCIDENT: "incident/",
  INTERVENTION: "intervention/",
  POSITIVE_REMARKS: "positive_remarks/",
  STUDENTS: {
    SEARCH: "students/search",
  },
  ADMIN: {
    INCIDENT_TYPE: "admin/incident_type",
    CASE_STATE: "admin/case_state",
    USER: "admin/user",
  },
} as const;

export default Paths;
