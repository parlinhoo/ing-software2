import { signIn } from './auth/authController.js';

import * as readline from 'readline/promises';
import { getActionDescription, getRoleActions } from './auth/roleController.js';
import { addCaseState, addIncidentType, addPositiveRemarks, deleteCaseState, deleteIncident, editCaseState, editIncident, editIncidentType, getIncidents, registerIncident, setIncidentState } from './services/incidentService.js';
import { editIntervention, registerIntervention } from './services/interventionService.js';
import { getReport } from './services/reportGeneratorService.js';
import { createUser, deleteUser, editUser } from './services/userService.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function parseChoice(options: string[]) {
    for (let i = 0; i < options.length; i++) {
        console.log(`[${i}] ${options.at(i)}`);            
    }
    const choice = await rl.question("Seleccione una: ");
    const num = Number.parseInt(choice);
    if (Number.isNaN(num) || num < 0 || num >= options.length) {
        return;
    };
    return num;
}

while (true) {
    console.log("Ingrese sus credenciales:");
    const username = await rl.question("Usuario: ")
    const password = await rl.question("Contraseña: ")
    
    const role = await signIn(username!, password!);
    if (!role) {
        console.log("Credenciales inválidas, inténtelo de nuevo.");
        continue;
    }
    
    console.log(`Bienvenido, ${username}`);
    const actions = getRoleActions(role);
    const options = actions.map(getActionDescription);

    while (true) {
        console.log("\nAcciones disponibles:\n");
        const num = await parseChoice(["Cerrar sesión."].concat(options));
        if (num === 0) {
            console.log("Hasta luego!");
            break;
        }
        if (num === undefined) {
            console.log("Opción inválida.");
            continue;
        }
        const selected = actions.at(num-1);

        // logica
        console.log("")
        console.log(options.at(num-1));
        if (selected === "create-incident") {
            // simulacion
            await rl.question("Describa el incidente: ");
            await rl.question("Ingrese el tipo de incidente: ");
            await rl.question("Ingrese la gravedad: ");
            await rl.question("Ingrese la fecha: ");
            await rl.question("Ingrese el lugar: ");
            do {
                console.log("Actores:");
                console.log("[1] Agregar involucrado.");
                console.log("[2] Continuar.");
                const sel = await rl.question("Escoja una opción: ");
                if (sel !== "1") break;
                await rl.question("Nombre: ");
                console.log("");
            } while (true);
            await registerIncident(username, "harassment", "severe", [], "2026-04-27", "UdeC", "Certamen de DL"); // dummy
        }
        else if (selected === "edit-incident") {
            const id = await rl.question("Ingrese el id de incidente: ");
            while (true) {
                console.log("Elija un elemento a modificar: ");
                const num = await parseChoice([
                    "Continuar",
                    "Tipo de incidente.",
                    "Severidad.",
                    "Fecha.",
                    "Lugar.",
                    "Descripción.",
                ]);
                if (num === 0) break;
                if (num === undefined) {
                    console.log("Valor inválido.");
                    continue;
                }
                await rl.question("Valor nuevo: ");
            }
            await editIncident(Number.parseInt(id));
        }
        else if (selected === "delete-incident") {
            const id = await rl.question("Ingrese el id de incidente: ");
            console.log(`Realmente quiere eliminar el incidente ${id}?`);
            const num = await parseChoice(["Si", "No"]);
            if (num === 0) {
                await deleteIncident(Number.parseInt(id));
            }
        }
        else if (selected === "set-incident-state") {
            const id = await rl.question("Ingrese el id de incidente: ");
            await rl.question("Ingrese el nuevo estado: ");
            await setIncidentState(Number.parseInt(id), "open");
        }
        else if (selected === "add-intervention") {
            await rl.question("Ingrese el id de incidente: ");
            await rl.question("Describa la intervención: ");
            await rl.question("Ingrese la fecha: ");
            await rl.question("Ingrese el tipo de intervención: ");
            await registerIntervention(username, 0, "2026-04-27", "citation", "test");
        }
        else if (selected === "edit-intervention") {
            const incidentId = await rl.question("Ingrese el id de incidente: ");
            const interventionId = await rl.question("Ingrese el id de la intervención: ");
            while (true) {
                console.log("Elija un elemento a modificar: ");
                const num = await parseChoice([
                    "Continuar",
                    "Tipo de intervención.",
                    "Fecha.",
                    "Descripción.",
                ]);
                if (num === 0) break;
                if (num === undefined) {
                    console.log("Valor inválido.");
                    continue;
                }
                await rl.question("Valor nuevo: ");
            }
            await editIntervention(Number.parseInt(incidentId), Number.parseInt(interventionId));
        }
        else if (selected === "add-positive-remark") {
            const id = await rl.question("Ingrese el id del estudiante: ");
            await addPositiveRemarks(Number.parseInt(id));
        }
        else if (selected === "edit-case-states") {
            let choice;
            while (choice === undefined) {
                console.log("Seleccione acción: ");
                choice = await parseChoice([
                    "Crear estado de caso.",
                    "Modificar estado de caso.",
                    "Eliminar estado de caso.",
                ]);
                if (choice === undefined) {
                    console.log("Valor inválido.");
                }
            }
            switch (choice) {
                case 0:
                    const newState = await rl.question("Ingrese el estado de caso que quiera crear: ");
                    await addCaseState(newState);
                    break;
                case 1:
                    const prev = await rl.question("Ingrese el estado de caso que quiera modificar: ");
                    const new_ = await rl.question("Ingrese el estado de caso nuevo: ");
                    await editCaseState(prev, new_);
                    break;
                case 2:
                    const stateToDelete = await rl.question("Ingrese el estado de caso que quiera eliminar: ");
                    await deleteCaseState(stateToDelete);
                    break;
            }
        }
        else if (selected === "edit-incident-types") {
            let choice;
            while (choice === undefined) {
                console.log("Seleccione acción: ");
                choice = await parseChoice([
                    "Crear tipo de incidente.",
                    "Modificar tipo de incidente.",
                    "Eliminar tipo de incidente.",
                ]);
                if (choice === undefined) {
                    console.log("Valor inválido.");
                }
            }
            switch (choice) {
                case 0:
                    const newType = await rl.question("Ingrese el tipo de incidente que quiera crear: ");
                    await addIncidentType(newType);
                    break;
                case 1:
                    const prev = await rl.question("Ingrese el tipo de incidente que quiera modificar: ");
                    const new_ = await rl.question("Ingrese el tipo de incidente nuevo: ");
                    await editIncidentType(prev, new_);
                    break;
                case 2:
                    const typeToDelete = await rl.question("Ingrese el tipo de incidente que quiera eliminar: ");
                    await deleteCaseState(typeToDelete);
                    break;
            }
        }
        else if (selected === "get-student-history") {
            const id = await rl.question("Ingrese el id del estudiante a consultar: ");
            const response = await getIncidents(Number.parseInt(id));            
            console.log(response);
        }
        else if (selected === "view-dashboard") {
            const response = await getReport();
            console.log(response);
        }
        else if (selected === "edit-users") {
            let choice;
            while (choice === undefined) {
                console.log("Seleccione acción: ");
                choice = await parseChoice([
                    "Crear usuario.",
                    "Modificar usuario.",
                    "Eliminar usuario.",
                ]);
                if (choice === undefined) {
                    console.log("Valor inválido.");
                }
            }
            switch (choice) {
                case 0:
                    const username = await rl.question("Ingrese el nombre de usuario que quiera crear: ");
                    const password = await rl.question("Ingrese la constraseña del usuario que quiera crear: ");
                    const role = await rl.question("Ingrese el rol del usuario que quiera crear: ");
                    await createUser(username, password, "teacher");
                    break;
                case 1:
                    const usernameEdit = await rl.question("Ingrese el nombre del usuario que quiera modificar: ");
                    while (true) {
                        console.log("Elija un elemento a modificar: ");
                        const num = await parseChoice([
                            "Continuar",
                            "Nombre de usuario.",
                            "Contraseña.",
                            "Rol.",
                        ]);
                        if (num === 0) break;
                        if (num === undefined) {
                            console.log("Valor inválido.");
                            continue;
                        }
                        await rl.question("Valor nuevo: ");
                    }
                    await editUser(usernameEdit);
                    break;
                case 2:
                    const userToDelete = await rl.question("Ingrese el nombre del usuario que quiera eliminar: ");
                    await deleteUser(userToDelete);
                    break;
            }
        }
    }
}