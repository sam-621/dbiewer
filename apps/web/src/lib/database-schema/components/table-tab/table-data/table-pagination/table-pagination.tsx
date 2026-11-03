import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '@/shared/components/ui/pagination';

import { getTotalPages } from '../../../../utils/table-view.utils';

type Props = {
  shownRows: number;
  totalRows: number;
  durationMs: number | null;
  page: number;
  onPageChange: (page: number) => void;
};

export const TablePagination = ({
  shownRows,
  totalRows,
  durationMs,
  page,
  onPageChange
}: Props) => {
  const { t } = useTranslation();
  const totalPages = getTotalPages(totalRows);

  return (
    <footer className="flex shrink-0 items-center gap-4 border-t px-4 py-1.5 font-mono text-xs text-muted-foreground">
      <p>
        {t('{{shown, number}} of {{total, number}} rows', { shown: shownRows, total: totalRows })}
        {durationMs !== null && ` · ${durationMs} ms`}
      </p>
      <Pagination aria-label={t('Pagination')} className="mx-0 ms-auto w-auto items-center gap-2">
        <p>{t('Page {{page, number}} of {{totalPages, number}}', { page, totalPages })}</p>
        <PaginationContent className="gap-0.5">
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Previous page')}
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Next page')}
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </footer>
  );
};
