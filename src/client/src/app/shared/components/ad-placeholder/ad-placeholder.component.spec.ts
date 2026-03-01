import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdPlaceholderComponent } from './ad-placeholder.component';

describe('AdPlaceholderComponent', () => {
  let component: AdPlaceholderComponent;
  let fixture: ComponentFixture<AdPlaceholderComponent>;

  function createComponent(placement: string, format: any, context?: string): void {
    fixture = TestBed.createComponent(AdPlaceholderComponent);
    component = fixture.componentInstance;
    component.placement = placement;
    component.format = format;
    if (context) { component.context = context; }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdPlaceholderComponent]
    }).compileComponents();
  });

  it('should create', () => {
    createComponent('import-processing', 'medium-rectangle');
    expect(component).toBeTruthy();
  });

  it('should set data-testid="ad-placeholder" on host container', () => {
    createComponent('import-processing', 'medium-rectangle');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[data-testid="ad-placeholder"]');
    expect(container).toBeTruthy();
  });

  it('should render correct dimensions for medium-rectangle (300x250)', () => {
    createComponent('import-processing', 'medium-rectangle', 'credit-cards');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector<HTMLElement>('[data-testid="ad-placeholder"]');
    expect(container).toBeTruthy();
    expect(container!.style.width).toBe('300px');
    expect(container!.style.height).toBe('250px');
    expect(container!.style.minWidth).toBe('300px');
    expect(container!.style.minHeight).toBe('250px');
  });

  it('should render correct dimensions for skyscraper (160x600)', () => {
    createComponent('sidebar', 'skyscraper');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector<HTMLElement>('[data-testid="ad-placeholder"]');
    expect(container!.style.width).toBe('160px');
    expect(container!.style.height).toBe('600px');
  });

  it('should render correct dimensions for banner (728x90)', () => {
    createComponent('dashboard-banner', 'banner');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector<HTMLElement>('[data-testid="ad-placeholder"]');
    expect(container!.style.width).toBe('728px');
    expect(container!.style.height).toBe('90px');
  });

  it('should render correct dimensions for mobile-banner (320x50)', () => {
    createComponent('mobile-footer', 'mobile-banner');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector<HTMLElement>('[data-testid="ad-placeholder"]');
    expect(container!.style.width).toBe('320px');
    expect(container!.style.height).toBe('50px');
  });

  it('should expose adContainerId based on placement', () => {
    createComponent('import-processing', 'medium-rectangle');
    expect(component.adContainerId).toBe('google-ad-import-processing');
  });

  it('should set data-placement on the container element', () => {
    createComponent('import-processing', 'medium-rectangle', 'credit-cards');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[data-testid="ad-placeholder"]');
    expect(container?.getAttribute('data-placement')).toBe('import-processing');
  });

  it('should set data-format on the container element', () => {
    createComponent('import-processing', 'medium-rectangle');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[data-testid="ad-placeholder"]');
    expect(container?.getAttribute('data-format')).toBe('medium-rectangle');
  });

  it('should set data-context when provided', () => {
    createComponent('import-processing', 'medium-rectangle', 'credit-cards');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[data-testid="ad-placeholder"]');
    expect(container?.getAttribute('data-context')).toBe('credit-cards');
  });

  it('should have role="complementary" for accessibility', () => {
    createComponent('import-processing', 'medium-rectangle');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[data-testid="ad-placeholder"]');
    expect(container?.getAttribute('role')).toBe('complementary');
  });

  it('should have tabindex="-1" preventing keyboard focus trap', () => {
    createComponent('import-processing', 'medium-rectangle');
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('[data-testid="ad-placeholder"]');
    expect(container?.getAttribute('tabindex')).toBe('-1');
  });

  it('should show advertisement label in dev placeholder', () => {
    createComponent('import-processing', 'medium-rectangle');
    const el: HTMLElement = fixture.nativeElement;
    const label = el.querySelector('.ad-label');
    expect(label?.textContent?.trim().toLowerCase()).toContain('advertisement');
  });

  it('should emit adLoaded output', () => {
    createComponent('import-processing', 'medium-rectangle');
    let emitted = false;
    component.adLoaded.subscribe(() => { emitted = true; });
    component.adLoaded.emit();
    expect(emitted).toBeTrue();
  });

  it('should emit adClicked output', () => {
    createComponent('import-processing', 'medium-rectangle');
    let emitted = false;
    component.adClicked.subscribe(() => { emitted = true; });
    component.adClicked.emit();
    expect(emitted).toBeTrue();
  });
});
