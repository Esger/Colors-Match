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
        this._dragged = false;
    }

    getClientPos(event) {
        const clientX = (event.touches) ? event.touches[0].clientX : event.clientX;
        const clientY = (event.touches) ? event.touches[0].clientY : event.clientY;
        return {
            left: clientX,
            top: clientY
        };
    }

    startDrag(event) {
        if (!this._element) {
            this._element = event.target;
            this._dragStartPos = this.getClientPos(event);
            this._dragPreviousPos = this._dragStartPos;

            const element = {
                element: this._element,
                left: this._dragStartPos.left,
                top: this._dragStartPos.top
            };

            this._eventAggregator.publish('startDrag', element);
        }
        return false;
    }

    doDrag(event) {
        if (this._element) {
            const clientPos = this.getClientPos(event);
            const dx = clientPos.left - this._dragPreviousPos.left;
            const dy = clientPos.top - this._dragPreviousPos.top;
            if (Math.abs(dx) + Math.abs(dy) > 0) {
                this._dragPreviousPos = clientPos;
    
                const element = {
                    element: this._element,
                    dx: dx,
                    dy: dy
                };
    
                this._eventAggregator.publish('doDrag', element);
            }
        }
    }

    stopDrag(event) {
        if (this._element) {
            const element = {
                element: this._element,
            };

            this._eventAggregator.publish('stopDrag', element);
            this._element = undefined;
            this._dragPreviousPos = undefined;
        }
    }

}
