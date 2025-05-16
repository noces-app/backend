import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDecorator } from '../common/decorators/user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserInterface } from 'src/common/interfaces/user.interface';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @UserDecorator() user: UserInterface,
  ) {
    return this.eventsService.create(createEventDto, user._id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all events (public or owned by user if authenticated)',
  })
  @ApiResponse({ status: 200, description: 'List of events' })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @UserDecorator() user?: UserInterface,
  ) {
    return this.eventsService.findAll(paginationQuery, user?._id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'List of upcoming events' })
  async findUpcoming(
    @Query() paginationQuery: PaginationQueryDto,
    @UserDecorator() user?: UserInterface,
  ) {
    return this.eventsService.findUpcoming(paginationQuery, user?._id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events created by the current user' })
  @ApiResponse({ status: 200, description: 'List of user events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyEvents(
    @Query() paginationQuery: PaginationQueryDto,
    @UserDecorator() user: UserInterface,
  ) {
    return this.eventsService.findByUser(user._id, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() user?: UserInterface,
  ) {
    return this.eventsService.findOne(id, user?._id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UserDecorator() user: UserInterface,
  ) {
    return this.eventsService.update(id, updateEventDto, user._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id') id: string, @UserDecorator() user: UserInterface) {
    await this.eventsService.remove(id, user._id);
    return { message: 'Event deleted successfully' };
  }
}
