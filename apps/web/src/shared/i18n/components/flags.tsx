import type { ComponentProps, SVGProps } from 'react';

import { cn } from '@/shared/utils/cn';

export const MexicoFlag = ({ className, ...props }: ComponentProps<'img'>) => (
  <img
    src="/icons8-mexico-96.png"
    alt=""
    width={18}
    height={18}
    className={cn('size-[18px] scale-110 rounded-full object-cover', className)}
    {...props}
  />
);

export const UsaFlag = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#usa-flag-clip)">
      <path
        d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18Z"
        fill="#F0F0F0"
      />
      <path
        d="M8.60864 9.00001H18.0001C18.0001 8.18787 17.892 7.40108 17.6905 6.65221H8.60864V9.00001Z"
        fill="#D80027"
      />
      <path
        d="M8.60864 4.30436H16.6789C16.1281 3.40566 15.4239 2.61088 14.6033 1.95654H8.60864V4.30436Z"
        fill="#D80027"
      />
      <path
        d="M9.00007 18.0001C11.1183 18.0001 13.0654 17.2679 14.6035 16.0435H3.39667C4.93475 17.2679 6.88186 18.0001 9.00007 18.0001Z"
        fill="#D80027"
      />
      <path
        d="M1.32106 13.6957H16.6791C17.1209 12.9748 17.4635 12.1866 17.6905 11.3479H0.309692C0.536661 12.1866 0.879224 12.9748 1.32106 13.6957Z"
        fill="#D80027"
      />
      <path
        d="M4.16878 1.40554H4.98955L4.22585 1.96035L4.51752 2.85809L3.75385 2.30328L2.99017 2.85809L3.24211 2.08246C2.57023 2.64207 1.98146 3.29845 1.49466 4.03105H1.75759L1.27155 4.38419C1.19583 4.51048 1.12319 4.63897 1.05356 4.7695L1.28563 5.48387L0.852616 5.16924C0.744963 5.39723 0.646519 5.63038 0.558044 5.86841L0.813645 6.65526H1.7572L0.993496 7.21008L1.28517 8.10782L0.521499 7.55301L0.0641907 7.88529C0.0220137 8.25099 0 8.62291 0 9.00003H9C9 4.0295 9 3.44348 9 0C7.22417 0 5.5686 0.514423 4.16878 1.40554Z"
        fill="#0052B4"
      />
    </g>
    <defs>
      <clipPath id="usa-flag-clip">
        <rect width="18" height="18" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
