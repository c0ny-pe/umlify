import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExportScalaButton from '../components/ExportScalaButton';

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../hooks/useGlobalContext', () => ({
  useGlobalContext: () => ({
    setToast: vi.fn(),
  }),
}));

vi.mock('shiki/bundle/full', () => ({
  codeToHtml: vi.fn().mockResolvedValue('<pre>mock scala</pre>'),
}));

import api from '../services/api';

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn> };

const emptyPayload = {
  nodes: [],
  edges: [],
};

describe('ExportScalaButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the export button', () => {
    render(<ExportScalaButton payload={emptyPayload} />);
    expect(screen.getByText('Código fuente en Scala')).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    mockApi.post.mockResolvedValueOnce({ data: 'class Foo {}' });

    render(<ExportScalaButton payload={emptyPayload} />);
    fireEvent.click(screen.getByText('Código fuente en Scala'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows loading state while API call is in progress', async () => {
    mockApi.post.mockReturnValueOnce(new Promise(() => {}));

    render(<ExportScalaButton payload={emptyPayload} />);
    fireEvent.click(screen.getByText('Código fuente en Scala'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Generando código...')).toBeInTheDocument();
    });
  });

  it('displays code in text field after API resolves', async () => {
    mockApi.post.mockResolvedValueOnce({ data: 'class Foo {}' });

    vi.mocked(await import('shiki/bundle/full')).codeToHtml = vi.fn().mockRejectedValue(new Error('skip'));

    render(<ExportScalaButton payload={emptyPayload} />);
    fireEvent.click(screen.getByText('Código fuente en Scala'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('class Foo {}')).toBeInTheDocument();
    });
  });

  it('calls onToast with error when API fails', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('network error'));
    const onToast = vi.fn();

    render(<ExportScalaButton payload={emptyPayload} onToast={onToast} />);
    fireEvent.click(screen.getByText('Código fuente en Scala'));

    await waitFor(() => {
      expect(onToast).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' }),
      );
    });
  });

  it('copy button is disabled while loading', async () => {
    mockApi.post.mockReturnValueOnce(new Promise(() => {}));

    render(<ExportScalaButton payload={emptyPayload} />);
    fireEvent.click(screen.getByText('Código fuente en Scala'));

    await waitFor(() => {
      const copyBtn = screen.getByRole('button', { name: /copiar/i });
      expect(copyBtn).toBeDisabled();
    });
  });

  it('calls api.post with the provided payload', async () => {
    mockApi.post.mockResolvedValueOnce({ data: '' });
    const payload = {
      nodes: [{ id: '1', name: 'Bar', classType: 'concreteClass', fields: [], methods: [], x: 0, y: 0 }],
      edges: [],
    };

    render(<ExportScalaButton payload={payload} />);
    fireEvent.click(screen.getByText('Código fuente en Scala'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/generator', payload, expect.any(Object));
    });
  });
});
