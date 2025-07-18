import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, HostListener, Inject, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.css']
})
export class ScrollTopComponent implements AfterViewInit, OnDestroy {
  @Input() scrollContainer?: HTMLElement;
  windowScrolled = false;
  private scrollListener: any;

  ngAfterViewInit() {
    if (this.scrollContainer) {
      this.scrollListener = () => this.onScroll();
      this.scrollContainer.addEventListener('scroll', this.scrollListener);
    } else {
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  ngOnDestroy() {
    if (this.scrollContainer && this.scrollListener) {
      this.scrollContainer.removeEventListener('scroll', this.scrollListener);
    } else {
      window.removeEventListener('scroll', this.onScroll.bind(this));
    }
  }

  onScroll = () => {
    const scrollTop = this.scrollContainer
      ? this.scrollContainer.scrollTop
      : window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    this.windowScrolled = scrollTop > 100;
  };

  scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
