interface ConsoleLogEntry {
  id: number;
  level: string;
  message: string;
  timestamp: Date;
}

class ConsoleLogger {
  private logs: ConsoleLogEntry[] = [];
  private maxLogs = 500;
  private nextId = 1;
  private originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
  };

  constructor() {
    this.intercept();
  }

  private intercept() {
    console.log = (...args: any[]) => {
      this.addLog("info", args);
      this.originalConsole.log(...args);
    };

    console.error = (...args: any[]) => {
      this.addLog("error", args);
      this.originalConsole.error(...args);
    };

    console.warn = (...args: any[]) => {
      this.addLog("warn", args);
      this.originalConsole.warn(...args);
    };

    console.info = (...args: any[]) => {
      this.addLog("info", args);
      this.originalConsole.info(...args);
    };
  }

  private addLog(level: string, args: any[]) {
    const message = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    this.logs.unshift({
      id: this.nextId++,
      level,
      message,
      timestamp: new Date(),
    });

    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  getLogs(): ConsoleLogEntry[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}

export const consoleLogger = new ConsoleLogger();
