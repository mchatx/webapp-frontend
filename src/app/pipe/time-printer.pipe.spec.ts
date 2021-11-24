import { TimePrinterPipe } from './time-printer.pipe';

describe('TimePrinterPipe', () => {
  it('create an instance', () => {
    const pipe = new TimePrinterPipe();
    expect(pipe).toBeTruthy();
  });
});
