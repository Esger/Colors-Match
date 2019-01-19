import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';

@inject(DragService, EventAggregator)
export class GameCustomElement {

    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this.title = '1+1';
        this.score = 0;
    }

    attached() {
        this.highSubscriber = this._eventAggregator.subscribe('high', value => {
            this.title = value + '+' + value;
        });
        this.scoreSubscriber = this._eventAggregator.subscribe('score', value => {
            this.score += value;
        });
    }

    detached() {
        this.highSubscriber.dispose();
        this.scoreSubscriber.dispose();
    }

}
