import { UAParser } from 'ua-parser-js';

export class DeviceDetector {
  static parse(userAgent: string | undefined) {
    if (!userAgent) {
      return {
        deviceName: 'Unknown Device',
        deviceType: 'desktop',
        browser: 'Unknown Browser',
        os: 'Unknown OS',
      };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      deviceName: this.getDeviceName(result),
      deviceType: this.getDeviceType(result),
      browser: this.getBrowserInfo(result),
      os: this.getOSInfo(result),
    };
  }

  private static getDeviceName(result: UAParser.IResult): string {
    if (result.device.model) {
      return result.device.model;
    }
    if (result.os.name === 'Mac OS') return 'MacBook';
    if (result.os.name === 'Windows') return 'Windows PC';
    if (result.os.name === 'iOS') return result.device.model || 'iPhone';
    if (result.os.name === 'Android') return result.device.vendor || 'Android Device';
    return 'Unknown Device';
  }

  private static getDeviceType(result: UAParser.IResult): string {
    if (result.device.type === 'mobile') return 'mobile';
    if (result.device.type === 'tablet') return 'tablet';
    return 'desktop';
  }

  private static getBrowserInfo(result: UAParser.IResult): string {
    const name = result.browser.name || 'Unknown';
    const version = result.browser.version || '';
    return version ? `${name} ${version}` : name;
  }

  private static getOSInfo(result: UAParser.IResult): string {
    const name = result.os.name || 'Unknown';
    const version = result.os.version || '';
    return version ? `${name} ${version}` : name;
  }
}
