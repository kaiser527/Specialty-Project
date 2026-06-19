import dayjs from './dayjs.config';

export const getVnpayLogger = async () => {
  const { ignoreLogger } = await import('vnpay');
  return ignoreLogger;
};

export const generateDateRange = (
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'month',
) => {
  const dates: string[] = [];

  let current = dayjs(startDate).utc();
  const end = dayjs(endDate).utc();

  const format = groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format(format));

    current =
      groupBy === 'month'
        ? current.add(1, 'month').startOf('month')
        : current.add(1, 'day');
  }

  return [...new Set(dates)];
};
