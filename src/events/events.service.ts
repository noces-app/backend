import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Event } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
  ) {}

  /**
   * Create a new event
   */
  async create(
    createEventDto: CreateEventDto,
    userId: ObjectId,
  ): Promise<Event> {
    const newEvent = new this.eventModel({
      ...createEventDto,
      createdBy: userId,
    });
    return newEvent.save();
  }

  /**
   * Find all events with pagination
   * If userId is provided, filter by createdBy or isPublic
   */
  async findAll(paginationQuery: PaginationQueryDto, userId?: ObjectId) {
    const { limit = 25, page = 1, sort, order } = paginationQuery;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> =
      sort && order ? { [sort]: order === 'asc' ? 1 : -1 } : { date: 1 }; // Default sort by date ascending

    // Build filter
    const filter = userId
      ? { $or: [{ isPublic: true }, { createdBy: userId }] }
      : { isPublic: true };

    const [items, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .exec(),
      this.eventModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find upcoming events
   */
  async findUpcoming(paginationQuery: PaginationQueryDto, userId?: ObjectId) {
    const { limit = 25, page = 1, sort, order } = paginationQuery;
    const skip = (page - 1) * limit;

    const today = new Date();

    // Build filter
    const filter = userId
      ? {
          date: { $gte: today },
          $or: [{ isPublic: true }, { createdBy: userId }],
        }
      : {
          date: { $gte: today },
          isPublic: true,
        };

    // Default sort by date for upcoming events, but allow override
    const sortOptions: Record<string, 1 | -1> =
      sort && order ? { [sort]: order === 'asc' ? 1 : -1 } : { date: 1 };

    const [items, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .exec(),
      this.eventModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one event by ID
   */
  async findOne(id: string, userId?: ObjectId): Promise<Event> {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: ${id}`);
    }

    // Build filter
    const filter = userId
      ? {
          _id: id,
          $or: [{ isPublic: true }, { createdBy: userId }],
        }
      : {
          _id: id,
          isPublic: true,
        };

    const event = await this.eventModel
      .findOne(filter)
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!event) {
      throw new NotFoundException(
        `Event with ID ${id} not found or not accessible`,
      );
    }

    return event;
  }

  /**
   * Update an event
   */
  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: ObjectId,
  ): Promise<Event> {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: ${id}`);
    }

    // Find event to check ownership
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Check if user is the creator of the event
    if (event.createdBy._id !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Update event
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return updatedEvent;
  }

  /**
   * Delete an event
   */
  async remove(id: string, userId: ObjectId): Promise<void> {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: ${id}`);
    }

    // Find event to check ownership
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Check if user is the creator of the event
    if (event.createdBy._id !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    // Delete event
    await this.eventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Find events created by a specific user
   */
  async findByUser(userId: ObjectId, paginationQuery: PaginationQueryDto) {
    const { limit = 25, page = 1, sort, order } = paginationQuery;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> =
      sort && order ? { [sort]: order === 'asc' ? 1 : -1 } : { date: 1 }; // Default sort by date ascending

    const [items, total] = await Promise.all([
      this.eventModel
        .find({ createdBy: userId })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .exec(),
      this.eventModel.countDocuments({ createdBy: userId }).exec(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
