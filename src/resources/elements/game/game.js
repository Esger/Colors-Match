import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';

@inject(DragService, EventAggregator)
export class GameCustomElement {

    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this._resetScore();
    }

    attached() {
        this.highSubscriber = this._eventAggregator.subscribe('high', value => {
            this.title = value + '+' + value;
        });
        this.resetScoreSubscriber = this._eventAggregator.subscribe('reset-score', value => {
            this._resetScore();
        });
    }

    _resetScore() {
        this.title = '1+1';
    }

    restart() {
        this._eventAggregator.publish('restart');
    }

    detached() {
        this.highSubscriber.dispose();
        this.resetScoreSubscriber.dispose();
    }

}
