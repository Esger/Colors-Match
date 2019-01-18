import {
    inject,
    bindable
} from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)

export class DragService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._dragStartPos = undefined;
        this._dragEndPos = undefined;
        this._lastZindex = 1;
    }

    getClientPos(event) {
        let clientX = (event.touches) ? event.touches[0].clientX : event.clientX;
        let clientY = (event.touches) ? event.touches[0].clientY : event.clientY;
        return {
            left: clientX,
            top: clientY
        };
    }

    startDrag(x, y, event) {
        if (!this._tile) {
            this._tile = event.target;
            this._tile.style.zIndex = this._lastZindex++;
            this._tileStartPos = $(this._tile).position();
            this._dragStartPos = this.getClientPos(event);

            let tile = {
                element: this._tile,
                left: x,
                top: y
            };

            this._eventAggregator.publish('startDrag', tile);
        }
        return false;
    }

    doDrag(event) {
        let clientPos = this.getClientPos(event);
        if (this._tile) {
            let dx = clientPos.left - this._dragStartPos.left;
            let dy = clientPos.top - this._dragStartPos.top;

            let tile = {
                element: this._tile,
                left: dx,
                top: dy
            };

            this._eventAggregator.publish('doDrag', tile);
        }
    }

    stopDrag(event) {
        if (this._tile) {
            let tile = {
                element: this._tile,
            };

            this._eventAggregator.publish('stopDrag', tile);
        }

        this._tile = undefined;
    }

    // isDragged() {
    //     return ((Math.abs(this.dragEndPos.x - this.dragStartPos.x) > 19) || (Math.abs(this.dragEndPos.y - this.dragStartPos.y) > 19));
    // }
}
