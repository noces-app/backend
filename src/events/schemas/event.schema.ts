import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @Prop({ default: false })
  isPublic: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Add indexes
EventSchema.index({ date: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ isPublic: 1 });
