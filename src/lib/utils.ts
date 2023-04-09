export function getYear(text: string): string {
  const regex = /(\d{4})(?:\.\d{2}|)-(\d{4}|)/;
  const match = text.match(regex);
  let result = ''
  if (match) {
    const startYear = parseInt(match[1]);
    let endYear = match[2] ? parseInt(match[2]) : new Date().getFullYear();
    
    // 如果省略号之后是空格或没有内容，则认为其结束的年份就是当前年份加 1
    if (isNaN(endYear) || endYear === 0) {
      endYear = new Date().getFullYear() + 1;
    }

    result = `${startYear}-${endYear}`;
  }
  return result
}

export function completeYearArray(years: string[]): string[] {
  const startYear = Math.min(+years[0], +years[1]);
  const endYear = Math.max(+years[0], +years[1]);
  const yearArray = [];

  for (let year = startYear; year <= endYear; year += 1) {
    yearArray.push(`${year}`);
  }

  return yearArray;
}

export function divideInto(str: string): string[] {
  const index = str.indexOf(' ');
  if (index > -1) {
    return [str.substr(0, index), str.substr(index + 1, str.length - 1)]
  }
  return []
}
