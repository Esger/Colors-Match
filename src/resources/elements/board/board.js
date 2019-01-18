
import { inject } from 'aurelia-framework';
import { DragService } from 'resources/services/drag-service';
@inject(DragService)

export class BoardCustomElement {

    constructor(dragService) {
        this.dragService = dragService;
        this.boardSize = 7;
        this.distance = 9.666;
        this.offset = 2;
        this.row = new Array(this.boardSize).fill().map(t => 1);
        this.board = new Array(this.boardSize).fill().map(r => this.row);
    }

    attached() {
        // console.table(this.board);
    }
}