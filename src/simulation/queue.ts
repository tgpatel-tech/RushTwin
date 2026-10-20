export class EventQueue<T extends { time: number; sequence: number }> {
  private heap: T[] = [];
  get size() {
    return this.heap.length;
  }
  private before(a: T, b: T) {
    return a.time < b.time || (a.time === b.time && a.sequence < b.sequence);
  }
  push(value: T) {
    this.heap.push(value);
    let i = this.heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.before(this.heap[i], this.heap[p])) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }
  pop(): T | undefined {
    const first = this.heap[0],
      last = this.heap.pop();
    if (this.heap.length && last) {
      this.heap[0] = last;
      let i = 0;
      for (;;) {
        let next = i;
        const left = i * 2 + 1,
          right = left + 1;
        if (left < this.size && this.before(this.heap[left], this.heap[next]))
          next = left;
        if (right < this.size && this.before(this.heap[right], this.heap[next]))
          next = right;
        if (next === i) break;
        [this.heap[i], this.heap[next]] = [this.heap[next], this.heap[i]];
        i = next;
      }
    }
    return first;
  }
}
export class Fifo<T> {
  private items: T[] = [];
  private head = 0;
  get size() {
    return this.items.length - this.head;
  }
  push(v: T) {
    this.items.push(v);
  }
  pop() {
    if (!this.size) return undefined;
    const v = this.items[this.head++];
    if (this.head > 1024 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return v;
  }
}
