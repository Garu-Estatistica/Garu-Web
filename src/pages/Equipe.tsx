import { Text, Paper, Title, Avatar } from '@mantine/core';
import PageWrapper from '../components/PageWrapper';

import camilaImg from '../assets/images/camila.jpg';
import flaviaImg from '../assets/images/flavia.jpg';
import alessandraImg from '../assets/images/alessandra.jpg';
import leonardoImg from '../assets/images/leonardo.png';
import gabrielGImg from '../assets/images/gabriel.jpg';
import joaoImg from '../assets/images/joao.jpg';
import tiagoImg from '../assets/images/tiago.jpg';

interface TeamMember {
  name: string;
  title?: string;
  image?: string;
  affiliations: string[];
  email?: string;
}

interface TeamSection {
  label: string;
  color: string;
  members: TeamMember[];
}

const sections: TeamSection[] = [
  {
    label: 'Coordenadora',
    color: '#228be6',
    members: [
      {
        name: 'Profa. Dra. Camila Bertini Martins',
        image: camilaImg,
        affiliations: ['DMP, EPM-UNIFESP'],
        email: 'cb.martins@unifesp.br',
      },
    ],
  },
  {
    label: 'Colaboradores',
    color: '#40c057',
    members: [
      {
        name: 'Prof. Dr. Tiago de Oliveira',
        image: tiagoImg,
        affiliations: ['ICT-UNIFESP'],
      },
      {
        name: 'Profa. Dra. Flávia Cristina Martins Queiroz Mariano',
        image: flaviaImg,
        affiliations: ['ITA-SJC'],
      },
      {
        name: 'Dra. Alessandra Aparecida da Silva Menezes',
        image: alessandraImg,
        affiliations: ['DMP, EPM-UNIFESP'],
      },
    ],
  },
  {
    label: 'Desenvolvedores',
    color: '#be4bdb',
    members: [
      {
        name: 'Leonardo Scadelai',
        image: leonardoImg,
        affiliations: ['Engenharia da Computação', 'ICT-UNIFESP'],
      },
      {
        name: 'Gabriel Junior Takita Pires',
        affiliations: ['Graduação em Medicina', 'EPM-UNIFESP'],
      },
      {
        name: 'Gabriel Graciano Dias',
        image: gabrielGImg,
        affiliations: ['Biomedicina', 'EPM-UNIFESP'],
      },
      {
        name: 'João Henrique de Araújo Morais',
        image: joaoImg,
        affiliations: ['Engenharia da Computação', 'ICT-UNIFESP'],
      },
    ],
  },
];

/** Extract initials from a name (first + last) */
function getInitials(name: string): string {
  // Remove titles like Profa., Dr., Dra., Prof.
  const cleaned = name.replace(/\b(Profa?\.|Dra?\.)\s*/gi, '').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <Paper shadow="xs" p="lg" withBorder style={{ textAlign: 'center', width: 220, margin: '0 12px 20px' }}>
      {member.image ? (
        <img
          src={member.image}
          alt={member.name}
          style={{
            width: 130,
            height: 130,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Avatar
          size={130}
          radius="50%"
          color="cyan"
          variant="light"
          style={{ margin: '0 auto' }}
        >
          <Text size="xl" fw={600}>{getInitials(member.name)}</Text>
        </Avatar>
      )}
      <Text fw={700} mt="sm">
        {member.name}
      </Text>
      {member.affiliations.map((line, i) => (
        <Text size="sm" c="dimmed" key={i}>
          {line}
        </Text>
      ))}
      {member.email && (
        <Text size="sm" c="blue" mt={4}>
          <a href={`mailto:${member.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {member.email}
          </a>
        </Text>
      )}
    </Paper>
  );
}

export default function Equipe() {
  return (
    <PageWrapper title="Equipe" color="gray">
      {sections.map((section) => (
        <div key={section.label} style={{ marginBottom: 32 }}>
          <Title order={4} mb="md" c={section.color} ta="center">
            {section.label}
          </Title>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {section.members.map((member) => (
              <MemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      ))}
    </PageWrapper>
  );
}
