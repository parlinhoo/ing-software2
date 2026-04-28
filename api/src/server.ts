import express, { NextFunction, Request, Response } from 'express';

import { RouteError } from '@src/utils/route-errors';
import { authenticate } from './auth/auth';

/******************************************************************************
                                Setup
******************************************************************************/

type SigninData = {
  username: string,
  password: string,
}

const app = express();

// **** Middleware **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*    AUTH     */

app.post("/auth/signin", (req: Request, res: Response,  next: NextFunction) => {
  const response: SigninData = req.body;
  
  const role = authenticate(response.username, response.password);
  
  res.send(role ?? "null");
})

/*    INCIDENTE     */

app.put("/incident", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/incident", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/incident", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.get("/incident", (req: Request, res: Response, next: NextFunction) => {
  res.send(JSON.stringify([
    {incidentId: 1, incidentType: "physical", severity: "mild", actors: [{name: "pedro", role: "aggresor"}, {name: "julio", role: "victim"}], date: "2026-04-01", place: "patio", description: "Codazo mientras jugaba"},
    {incidentId: 3, incidentType: "verbal", severity: "severe", actors: [{name: "horacio", role: "aggresor"}, {name: "pedro", role: "victim"}], date: "2026-03-15", place: "sala 3B", description: "Garabato porque pedro le sacó un lápiz"}
  ]))
})



/*         INTERVENCIONES         */ 

app.put("/intervention", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/intervention", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

/*        ANOTACIONES POSITIVAS      */

app.put("/positive_remark", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

/*        DATAVIS            */

app.get("/data", (req: Request, res: Response, next: NextFunction) => {
  res.send("Reporte:\nJuan ya tiene 2 incidentes severos este año.\nFernanda ha sido foco de 5 incidentes leves el último año, hacer seguimiento.\nJorge liberó un incidente severo con 3 anotaciones positivas el último mes.\n");
})

/*        ADMIN          */

app.put("/admin/incident_type", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/incident_type", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/incident_type", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

app.put("/admin/case_state", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/case_state", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/case_state", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

app.put("/admin/user", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/user", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/user", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (err instanceof RouteError) {
    res.status(err.status).json({ error: err.message });
  }
  return next(err);
});

/******************************************************************************
                                Export default
******************************************************************************/

export default app;
