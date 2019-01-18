
import { inject } from 'aurelia-framework';
import { DragService } from 'resources/services/drag-service';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(DragService, EventAggregator)

export class BoardCustomElement {

    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this.boardSize = 7;
        this.distance = 9.666;
        this.offset = 2;
        this.row = new Array(this.boardSize).fill().map(t => 1);
        this.board = new Array(this.boardSize).fill().map(r => this.row.slice());
    }

    attached() {
        this.startDragListener = this._eventAggregator.subscribe('startDrag', tile => {
            this._$tile = $(tile.element);
            this._$tile.addClass('dragging');
        });
        this.doDragListener = this._eventAggregator.subscribe('doDrag', tile => {
            let left = this._$tile.position().left + tile.left;
            let top = this._$tile.position().top + tile.top;
            this._$tile.css({ 'left': left, 'top': top });
        });
        this.stopDragListener = this._eventAggregator.subscribe('stopDrag', tile => {
            this._$tile.removeClass('dragging');
        });
    }

    detached() {
        this.startDragListener.dispose();
        this.doDragListener.dispose();
        this.stopDragListener.dispose();
    }
}
