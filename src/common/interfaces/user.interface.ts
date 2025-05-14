import { Document } from 'mongoose';

export interface User extends Document {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  keycloakId: string;
  createdAt: Date;
  updatedAt: Date;
}
