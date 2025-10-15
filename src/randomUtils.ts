


export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


export function permute(arr: Array<any>) {

  for (var i = 0; i < arr.length; ++i) {
    const index = getRandomInt(i, arr.length - 1);
    [arr[index], arr[i]] = [arr[i], arr[index]];
  }
}
