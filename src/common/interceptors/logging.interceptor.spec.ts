import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs'; // Import Observable
import { tap } from 'rxjs/operators';

// Mock the Logger class using jest.mock
jest.mock('@nestjs/common/services/logger.service');
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockModule: TestingModule;

  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Create a testing module with the interceptor and mock Logger
    mockModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          // Provide the mocked Logger instance
          provide: Logger,
          useValue: mockLogger, // Use the mock logger
        },
      ],
    }).compile();

    interceptor = mockModule.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should log request details upon completion', async () => {
      // Mocking ExecutionContext, Request, Response, and next.handle()
      const mockRequest = {
        method: 'GET',
        url: '/test',
      };
      const mockResponse = {
        statusCode: 200,
      };
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      };

      // Mock next.handle() to return an observable that emits and completes reliably
      const mockHandle = jest.fn().mockReturnValue(
        new Observable((subscriber) => {
          subscriber.next('some value'); // Emit a value to ensure tap callback runs
          subscriber.complete();       // Complete the observable
        }),
      );

      // Spy on Date.now to control time and calculate duration
      const mockDateNow = jest.spyOn(Date, 'now');
      mockDateNow.mockReturnValueOnce(1000); // Start time
      mockDateNow.mockReturnValueOnce(1500); // End time

      // Call the interceptor's intercept method and wait for the observable to complete
      await interceptor.intercept(mockExecutionContext as any, { handle: mockHandle }).toPromise();

      // Assertions
      expect(mockHandle).toHaveBeenCalled(); // Ensure next.handle was called
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('GET /test 200 500ms'), // Method, URL, Status, Duration
      );

      // Restore Date.now mock
      mockDateNow.mockRestore();
    });

    it('should log different status codes correctly', async () => {
      const mockRequest = { method: 'POST', url: '/submit' };
      const mockResponse = { statusCode: 404 };
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      };
      const mockHandle = jest.fn().mockReturnValue(
        new Observable((subscriber) => {
          subscriber.next('another value');
          subscriber.complete();
        }),
      );

      const mockDateNow = jest.spyOn(Date, 'now');
      mockDateNow.mockReturnValueOnce(2000); // Start time
      mockDateNow.mockReturnValueOnce(2100); // End time

      await interceptor.intercept(mockExecutionContext as any, { handle: mockHandle }).toPromise();

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('POST /submit 404 100ms'),
      );

      mockDateNow.mockRestore();
    });
  });
});
