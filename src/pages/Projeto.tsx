import { Image, Text, Stack, Paper, Anchor } from '@mantine/core';
import PageWrapper from '../components/PageWrapper';
import garuLogo from '../assets/images/garu_3.png';

export default function Projeto() {
  return (
    <PageWrapper title="Sobre o Garu Estatística" color="gray">
      <Paper shadow="xs" p="xl" withBorder>
        <Stack gap="md">
          <div style={{ textAlign: 'center' }}>
            <Image src={garuLogo} alt="Garu Estatística" maw="100%" />
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            <Text mb="sm">
              O Garu Estatística é um projeto de extensão universitária da Universidade Federal
              de São Paulo (Unifesp) dedicado ao desenvolvimento de tecnologias educacionais
              para o ensino e a aprendizagem da Estatística.
            </Text>
            <Text mb="sm">
              A plataforma reúne recursos interativos, simulações, visualizações, exercícios e
              atividades voltadas ao desenvolvimento do raciocínio estatístico, da interpretação
              crítica de dados e do letramento estatístico. Seu objetivo é apoiar estudantes,
              professores e profissionais da saúde na compreensão de conceitos estatísticos por
              meio de uma abordagem prática e baseada em problemas reais.
            </Text>
            <Text mb="sm">
              Embora a plataforma tenha sido concebida para apoiar o processo de ensino e
              aprendizagem, ela não substitui o papel do professor nem o estudo dos fundamentos
              da Estatística. A equipe busca continuamente garantir a qualidade das informações
              disponibilizadas, mas reconhece que melhorias são sempre possíveis. Sugestões,
              críticas construtivas e relatos de eventuais inconsistências são muito bem-vindos.
            </Text>
            <Text mb="sm">
              O desenvolvimento do Garu é orientado por evidências científicas e faz parte de
              uma linha de pesquisa em Educação Estatística e Tecnologias Educacionais. A
              descrição da primeira versão da plataforma foi publicada em:
            </Text>

            <Paper
              p="md"
              withBorder
              bg="gray.0"
              style={{ borderLeft: '4px solid var(--mantine-color-cyan-6)' }}
            >
              <Text size="sm" fs="italic" c="dimmed">
                MARTINS, Camila Bertini; MORAIS, João Henrique de Araújo; PUREZA, Isabele
                Rejane de Oliveira Maranhão; MARIANO, Flávia Cristina Queiroz Martins;
                OLIVEIRA, Tiago de.{' '}
                <Text span fw={600} c="dark">
                  Desenvolvimento de um Objeto de Aprendizagem para o Ensino da Estatística.
                </Text>{' '}
                <Text span>Abakós</Text>, Belo Horizonte, v. 11, n. 1, p. 125–140, 2023.
                DOI:&nbsp;10.5752/P.2316-9451.2023v11n1p125-140.
              </Text>
              <Anchor
                href="https://periodicos.pucminas.br/abakos/article/view/29433"
                target="_blank"
                size="sm"
                mt={4}
              >
                Acessar publicação ↗
              </Anchor>
            </Paper>

            <Text mt="md" mb="sm">
              A documentação referente à atualização tecnológica da plataforma — sua reestruturação em arquitetura baseada em React e TypeScript — também se encontra publicada como trabalho acadêmico no Repositório Institucional da Unifesp:
            </Text>

            <Paper
              p="md"
              withBorder
              bg="gray.0"
              style={{ borderLeft: '4px solid var(--mantine-color-cyan-6)' }}
            >
              <Text size="sm" fs="italic" c="dimmed">
                SCADELAI, Leonardo.{' '}
                <Text span fw={600} c="dark">
                  Garu Estatística: Aplicação de Métodos de Engenharia de Software e Design Centrado no Usuário na Reestruturação de uma Aplicação Web Educacional.
                </Text>{' '}
                <Text span>Trabalho de Conclusão de Curso (Engenharia de Computação)</Text> — Instituto de Ciência e Tecnologia, Universidade Federal de São Paulo. São José dos Campos, 2026.
              </Text>
              <Anchor
                href="https://repositorio.unifesp.br/items/edb392fa-1f4a-4a52-8888-5dcf04141b72"
                target="_blank"
                size="sm"
                mt={4}
                display="block"
              >
                Acessar documento no repositório ↗
              </Anchor>
            </Paper>

            <Text mt="md" mb="sm">
              Interessados em colaborar com o projeto — incluindo estudantes, professores,
              desenvolvedores e pesquisadores de qualquer instituição — podem entrar em contato
              pelo e-mail{' '}
              <Anchor href="mailto:garuestatistica@unifesp.br">
                garuestatistica@unifesp.br
              </Anchor>.
            </Text>
          </div>
        </Stack>
      </Paper>
    </PageWrapper>
  );
}
