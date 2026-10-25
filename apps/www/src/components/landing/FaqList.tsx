import type * as React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Code } from '@/components/ui/code';

const questions: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'Does dbiewer touch my data?',
    answer: (
      <>
        Only on read. We request <Code>SELECT</Code> + <Code>information_schema</Code> at connection
        time. Writes happen only when you explicitly run a write query, never automatically — not
        even from the AI assistant.
      </>
    )
  },
  {
    question: 'What\'s an "AI credit"?',
    answer:
      "One credit ≈ one assistant message round-trip (your prompt + the response). Schema reads and SQL highlighting don't cost credits — only conversations with the assistant do."
  },
  {
    question: 'Can I connect to a private database?',
    answer: (
      <>
        Yes — Pro includes a managed <b>SSH tunnel</b>. Paste your bastion details and we tunnel
        through. For tighter networking, look at Team or self-hosted.
      </>
    )
  },
  {
    question: 'Where are my credentials stored?',
    answer:
      'Encrypted at rest (AES-256, key per workspace) and decrypted only when establishing a connection. They never appear in chats, exports, or logs.'
  },
  {
    question: 'What databases are supported?',
    answer:
      'Postgres, MySQL, MariaDB, SQLite, Supabase, Neon, Railway, PlanetScale, ClickHouse. Mongo and BigQuery are in beta — opt in from your workspace settings.'
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Cancel from your billing page; you keep Pro features until the end of the period. Your saved queries, chats and connections stay accessible on Free (within Free limits).'
  }
];

export function FaqList(): React.ReactElement {
  return (
    <Card className="mx-auto mt-9 max-w-[760px] px-6">
      <Accordion>
        {questions.map(({ question, answer }) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger className="text-sm tracking-[-0.005em]">{question}</AccordionTrigger>
            <AccordionPanel
              keepMounted
              className="text-[13px] leading-relaxed [&_b]:text-foreground"
            >
              {answer}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
