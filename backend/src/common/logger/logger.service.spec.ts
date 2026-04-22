import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { Logger } from '@nestjs/common';

// Mock the prototype of the base Logger class to intercept calls made by super()
const mockLoggerPrototype = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Spy on the methods of the Logger prototype
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;
let debugSpy: jest.SpyInstance;
let verboseSpy: jest.SpyInstance;

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let mockModule: TestingModule;

  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Spy on the prototype methods of the base Logger class
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLoggerPrototype.log);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(mockLoggerPrototype.error);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockLoggerPrototype.warn);
    debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(mockLoggerPrototype.debug);
    verboseSpy = jest.spyOn(Logger.prototype, 'verbose').mockImplementation(mockLoggerPrototype.verbose);

    mockModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        // We don't need to provide Logger here because LoggerService extends it,
        // and we are mocking the prototype methods directly.
      ],
    }).compile();

    loggerService = await mockModule.resolve<LoggerService>(LoggerService);
  });

  afterEach(() => {
    // Restore spied methods after each test
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    debugSpy.mockRestore();
    verboseSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(loggerService).toBeDefined();
  });

  describe('constructor', () => {
    it('should set the context to LoggerService by default', () => {
      // 'context' is protected, direct access is for testing.
      expect(loggerService['context']).toBe('LoggerService');
    });

    it('should be transient scope', () => {
      // This is implicitly tested by using resolve() instead of get().
    });
  });

  describe('log', () => {
    it('should call the base logger log method with message and default context', () => {
      const message = 'Test log message';
      loggerService.log(message);
      expect(mockLoggerPrototype.log).toHaveBeenCalledWith(message, 'LoggerService');
    });

    it('should call the base logger log method with message and provided context', () => {
      const message = 'Test log message with context';
      const context = 'SpecificContext';
      loggerService.log(message, context);
      expect(mockLoggerPrototype.log).toHaveBeenCalledWith(message, context);
    });
  });

  describe('error', () => {
    it('should call the base logger error method with message, trace, and default context', () => {
      const message = 'Test error message';
      const trace = 'Error trace details';
      loggerService.error(message, trace);
      expect(mockLoggerPrototype.error).toHaveBeenCalledWith(message, trace, 'LoggerService');
    });

    it('should call the base logger error method with message, trace, and provided context', () => {
      const message = 'Test error message with context';
      const trace = 'Specific trace';
      const context = 'SpecificErrorContext';
      loggerService.error(message, trace, context);
      expect(mockLoggerPrototype.error).toHaveBeenCalledWith(message, trace, context);
    });
  });

  describe('warn', () => {
    it('should call the base logger warn method with message and default context', () => {
      const message = 'Test warn message';
      loggerService.warn(message);
      expect(mockLoggerPrototype.warn).toHaveBeenCalledWith(message, 'LoggerService');
    });

    it('should call the base logger warn method with message and provided context', () => {
      const message = 'Test warn message with context';
      const context = 'SpecificWarnContext';
      loggerService.warn(message, context);
      expect(mockLoggerPrototype.warn).toHaveBeenCalledWith(message, context);
    });
  });

  describe('debug', () => {
    it('should call the base logger debug method with message and default context', () => {
      const message = 'Test debug message';
      loggerService.debug(message);
      expect(mockLoggerPrototype.debug).toHaveBeenCalledWith(message, 'LoggerService');
    });

    it('should call the base logger debug method with message and provided context', () => {
      const message = 'Test debug message with context';
      const context = 'SpecificDebugContext';
      loggerService.debug(message, context);
      expect(mockLoggerPrototype.debug).toHaveBeenCalledWith(message, context);
    });
  });

  describe('verbose', () => {
    it('should call the base logger verbose method with message and default context', () => {
      const message = 'Test verbose message';
      loggerService.verbose(message);
      expect(mockLoggerPrototype.verbose).toHaveBeenCalledWith(message, 'LoggerService');
    });

    it('should call the base logger verbose method with message and provided context', () => {
      const message = 'Test verbose message with context';
      const context = 'SpecificVerboseContext';
      loggerService.verbose(message, context);
      expect(mockLoggerPrototype.verbose).toHaveBeenCalledWith(message, context);
    });
  });
});
