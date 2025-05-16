import { Document, ObjectId } from 'mongoose';

export interface UserInterface extends Document {
  _id: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  keycloakId: string;
  createdAt: Date;
  updatedAt: Date;
}
