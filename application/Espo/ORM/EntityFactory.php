<?php

namespace Espo\ORM;

class EntityFactory
{	
	protected $metadata;
	
	protected $entityManager;
	
	public function __construct(EntityManager $entityManager, Metadata $metadata)
	{
		$this->entityManager = $entityManager;
		$this->metadata = $metadata;	
	}
	public function create($name)
	{
		$className = $this->entityManager->normalizeEntityName($name);		
		$defs = $this->metdata->get($name);		
		$entity = new $className($defs);		
		return $entity;
	}

}


