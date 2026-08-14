import { Text, Paper, Anchor, Stack } from '@mantine/core';
import PageWrapper from '../components/PageWrapper';

export default function Contato() {
  return (
    <PageWrapper title="Contato" color="gray">
      <Paper shadow="xs" p="xl" withBorder>
        <Stack gap="md">
          <div>
            <Text mb="sm">
              Críticas, correções, sugestões ou interesse em participar do projeto
              devem ser enviadas para:
            </Text>
            <Text fw={700} mb="lg">
              <Anchor href="mailto:garuestatistica@unifesp.br">
                garuestatistica@unifesp.br
              </Anchor>
            </Text>
          </div>

          <div>
            <Text size="sm" fw={600} mb={4}>Coordenação</Text>
            <Text size="sm">
              Profa. Dra. Camila Bertini Martins — DMP, EPM-UNIFESP
            </Text>
            <Text size="sm">
              <Anchor href="mailto:cb.martins@unifesp.br">
                cb.martins@unifesp.br
              </Anchor>
            </Text>
          </div>

          <div>
            <Text size="sm" c="dimmed" mt="md">Garu Estatística, 2024.</Text>
          </div>
        </Stack>
      </Paper>
    </PageWrapper>
  );
}
