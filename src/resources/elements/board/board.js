
export class BoardCustomElement {

    constructor() {
        this.boardSize = 7;
        this.row = [];
        this.board = [];
        for (let x = 0; x < this.boardSize; x++) {
            this.row.push(1);
        }
        for (let y = 0; y < this.boardSize; y++) {
            this.board.push(this.row);
        }
    }

    attached() {
        console.table(this.board);
    }
}