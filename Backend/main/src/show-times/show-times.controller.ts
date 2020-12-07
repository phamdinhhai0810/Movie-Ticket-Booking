import { Body, Controller, Get, Logger, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ShowTimesService } from './show-times.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { getCoordinates } from '../common/utils';
import { AddShowTimeDto, MovieAndShowTime, TheatreAndShowTime } from './show-time.dto';
import { AuthGuard } from '../auth/auth.guard';
import { LocationDto } from '../common/location.dto';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ForAdmin } from '../common/swagger.decorator';
import { PaginationDto } from "../common/pagination.dto";
import { ShowTime } from "./show-time.schema";
import * as dayjs from "dayjs";
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

@ApiTags('show-times')
@UseGuards(AuthGuard)
@Controller('show-times')
export class ShowTimesController {
  private readonly logger = new Logger('ShowTimesController');

  constructor(
      private readonly showTimesService: ShowTimesService,
  ) {
  }

  @ApiOperation({summary: 'PRIVATE'})
  @Post('seed')
  seed() {
    return this.showTimesService.seed();
  }

  @Get('movies/:movie_id')
  async getShowTimesByMovieId(
      @Param('movie_id') movieId: string,
      @Query() locationDto: LocationDto,
  ): Promise<TheatreAndShowTime[]> {
    this.logger.debug(`getShowTimesByMovieId ${movieId} ${locationDto.lat}, ${locationDto.lng}`);

    const movieShowTimes = await this.showTimesService.getShowTimesByMovieId(
        movieId,
        getCoordinates(locationDto)
    );

    return movieShowTimes.map(doc => new TheatreAndShowTime(doc));
  }

  @Get('theatres/:theatre_id')
  async getShowTimesByTheatreId(
      @Param('theatre_id') theatreId: string,
  ): Promise<MovieAndShowTime[]> {
    const result = await this.showTimesService.getShowTimesByTheatreId(theatreId);
    return result.map(doc => new MovieAndShowTime(doc));
  }
}

@ApiTags('admin-show-times')
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin-show-times')
export class AdminShowTimesController {
  constructor(
      private readonly showTimesService: ShowTimesService,
  ) {
  }

  @ForAdmin()
  @Roles('ADMIN')
  @Post()
  addShowTime(
      @Body() dto: AddShowTimeDto,
  ) {
    return this.showTimesService.addShowTime(dto);
  }

  @ForAdmin()
  @Roles('ADMIN')
  @Get('theatres/:theatre_id')
  getShowTimesByTheatreId(
      @Param('theatre_id') theatreId: string,
      @Query() dto: PaginationDto,
  ): Promise<ShowTime[]> {
    return this.showTimesService.getShowTimesByTheatreIdAdmin(theatreId, dto);
  }

  @ForAdmin()
  @Roles('ADMIN')
  @Get('available-periods')
  getAvailablePeriods(
      @Query('theatre_id') theatreId: string,
      @Query('day') day: string,
  ) {
    return this.showTimesService.getAvailablePeriods(theatreId, day);
  }

  @Get('test')
  test() {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const start_time_date: Date = new Date('2020-12-07T17:48:28.262Z');
    Logger.debug(start_time_date.toISOString() + '[1] start_time_date');
    Logger.debug(start_time_date.toString() + '[1] start_time_date');

    const duration = 90;
    const start_time: dayjs.Dayjs = dayjs(start_time_date);
    Logger.debug(start_time.toISOString() + '[2] start_time');
    Logger.debug(start_time.toDate().toString() + '[2] start_time');

    const startTimeLocal = start_time.utcOffset(start_time.utcOffset(), false);
    Logger.debug(startTimeLocal.toISOString() + '[3] startTimeLocal');
    Logger.debug(startTimeLocal.toDate().toString() + '[3] startTimeLocal');
    const endTimeLocal: dayjs.Dayjs = startTimeLocal.add(duration, 'minute');
    Logger.debug(endTimeLocal.toISOString() + '[4] endTimeLocal');
    Logger.debug(endTimeLocal.toDate().toString() + '[4] endTimeLocal');

    const [startHString, endHString]: string[] = '9:00 - 23:00'.split(' - ');
    const [startH, startM]: number[] = startHString.split(':').map(x => +x);
    const [endH, endM]: number[] = endHString.split(':').map(x => +x);

    const startOfDayLocal: dayjs.Dayjs = startTimeLocal.startOf('day');
    Logger.debug(startOfDayLocal.toISOString() + '[5] startOfDayLocal');
    Logger.debug(startOfDayLocal.toDate().toString() + '[5] startOfDayLocal');
    const thStartTime: dayjs.Dayjs = startOfDayLocal.set('hour', startH).set('minute', startM);
    const thEndTime: dayjs.Dayjs = startOfDayLocal.set('hour', endH).set('minute', endM);

    Logger.debug(thStartTime.toISOString() + '[6] thStartTime');
    Logger.debug(thStartTime.toDate().toString() + '[6] thStartTime');
    Logger.debug(thEndTime.toISOString() + '[7] thEndTime');
    Logger.debug(thEndTime.toDate().toString() + '[7] thEndTime');
  }
}