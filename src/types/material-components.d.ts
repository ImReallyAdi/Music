// Type definitions for @xujunhao2010/material_components custom elements in React

declare namespace JSX {
  interface IntrinsicElements {
    'mc-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'standard';
      size?: 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
      disabled?: boolean;
      toggle?: boolean;
      selected?: boolean;
      flex?: boolean;
    }, HTMLElement>;

    'mc-toggle-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'standard';
      size?: 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
      disabled?: boolean;
      selected?: boolean;
    }, HTMLElement>;

    'mc-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      variant?: 'filled' | 'tonal' | 'outlined' | 'standard';
      size?: 'standard' | 'small' | 'large';
      disabled?: boolean;
      icon?: string;
    }, HTMLElement>;

    'mc-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name?: string;
      size?: string | number;
      type?: 'rounded' | 'sharp' | 'outlined'; // Guessing types based on common material icons
      filled?: boolean;
    }, HTMLElement>;

    'mc-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      label?: string;
      value?: string | number;
      type?: string;
      placeholder?: string;
      helper?: string; // Helper text
      disabled?: boolean;
      error?: boolean;
      icon?: string; // Trailing icon
      'leading-icon'?: string;
    }, HTMLElement>;

    'mc-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      variant?: 'elevated' | 'filled' | 'outlined';
    }, HTMLElement>;

    'mc-slider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      value?: number;
      min?: number;
      max?: number;
      step?: number;
      disabled?: boolean;
      labeled?: boolean;
    }, HTMLElement>;

    'mc-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      size?: 'small' | 'medium' | 'large';
      color?: 'primary' | 'secondary' | 'surface' | 'tertiary';
      icon?: string;
      label?: string; // For extended fab
    }, HTMLElement>;

    'mc-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      checked?: boolean;
      disabled?: boolean;
    }, HTMLElement>;

    'mc-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      checked?: boolean;
      disabled?: boolean;
      icon?: string;
    }, HTMLElement>;

    'mc-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

    'mc-list-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        headline?: string;
        supportingText?: string;
        trailingSupportingText?: string;
    }, HTMLElement>;

    'mc-ripple': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        color?: string;
        disabled?: boolean;
    }, HTMLElement>;
  }
}
