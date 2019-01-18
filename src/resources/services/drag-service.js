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
        if (!this._element) {
            this._element = event.target;
            this._dragStartPos = this.getClientPos(event);
            this._dragPreviousPos = this._dragStartPos;

            let element = {
                element: this._element,
                left: x,
                top: y
            };

            this._eventAggregator.publish('startDrag', element);
        }
        return false;
    }

    doDrag(event) {
        let clientPos = this.getClientPos(event);
        if (this._element) {
            let dx = clientPos.left - this._dragPreviousPos.left;
            let dy = clientPos.top - this._dragPreviousPos.top;
            this._dragPreviousPos = clientPos;

            let element = {
                element: this._element,
                left: dx,
                top: dy
            };

            this._eventAggregator.publish('doDrag', element);
        }
    }

    stopDrag(event) {
        if (this._element) {
            let element = {
                element: this._element,
            };

            this._eventAggregator.publish('stopDrag', element);
        }

        this._element = undefined;
    }

}
