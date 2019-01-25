import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';

@inject(DragService, EventAggregator)
export class TileCustomElement {
    @bindable tile;
    @bindable distance;
    @bindable offset;
    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;

    }
}