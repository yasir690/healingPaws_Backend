import { Router } from "express";

import * as petController from "../controller/petsController.js";

export const petRouter = Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

petRouter.post("/addPets", limiter, auth, petController.addPets);

petRouter.get("/getPets", limiter, auth, petController.getPets);

petRouter.delete("/deletePet/:petId", limiter, auth, petController.deletePet);

petRouter.put("/editPet/:petId", limiter, auth, petController.editPet);
