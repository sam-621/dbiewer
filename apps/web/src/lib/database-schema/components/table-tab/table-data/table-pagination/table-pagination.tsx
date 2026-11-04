import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '@/shared/components/ui/pagination';
import { Separator } from '@/shared/components/ui/separator';

import { getTotalPages } from '../../../../utils/table-view.utils';

type Props = {
  firstRowNumber: number;
  shownRows: number;
  totalRows: number;
  durationMs: number | null;
  page: number;
  onPageChange: (page: number) => void;
};

export const TablePagination = ({
  firstRowNumber,
  shownRows,
  totalRows,
  durationMs,
  page,
  onPageChange
}: Props) => {
  const { t } = useTranslation();
  const totalPages = getTotalPages(totalRows);

  return (
    <Pagination
      aria-label={t('Pagination')}
      className="absolute bottom-3 left-1/2 z-20 mx-0 h-8.5 w-auto -translate-x-1/2 items-center rounded-lg border bg-popover ps-3 pe-1 text-xs whitespace-nowrap text-muted-foreground shadow-lg"
    >
      <p>
        {t('{{from, number}}–{{to, number}} of {{total, number}}', {
          from: shownRows ? firstRowNumber : 0,
          to: firstRowNumber - 1 + shownRows,
          total: totalRows
        })}
        {durationMs !== null && ` · ${durationMs} ms`}
      </p>
      <Separator orientation="vertical" className="m-2" />
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
        <PaginationItem className="px-0.5 font-mono text-foreground">
          <span className="sr-only">
            {t('Page {{page, number}} of {{totalPages, number}}', { page, totalPages })}
          </span>
          <span aria-hidden="true">
            {t('{{page, number}} / {{totalPages, number}}', { page, totalPages })}
          </span>
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
  );
};
